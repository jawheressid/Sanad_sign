import math
import os
import re
import shutil
import subprocess
import sys
import threading
import time
import traceback
import uuid
import urllib.parse
import urllib.request
import io
from pathlib import Path
from typing import Optional

import numpy as np
from PIL import Image
from fastapi import BackgroundTasks, FastAPI, File, Form, HTTPException, UploadFile
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles

ROOT_DIR = Path(__file__).resolve().parents[1]
AI_DIR = ROOT_DIR / "AI"
if str(AI_DIR) not in sys.path:
    sys.path.insert(0, str(AI_DIR))

from pose_format import Pose
from spoken_to_signed.gloss_to_pose import CSVPoseLookup, concatenate_poses, gloss_to_pose
from spoken_to_signed.gloss_to_pose.lookup.fingerspelling_lookup import FingerspellingPoseLookup
from spoken_to_signed.skeleton_video import pose_to_skeleton_video

RUNS_DIR = Path(__file__).resolve().parent / "runs"
RUNS_DIR.mkdir(parents=True, exist_ok=True)

DEFAULT_LEXICON = (AI_DIR / "assets" / "dummy_lexicon").resolve()
DEFAULT_MAX_YOUTUBE_DURATION_SEC = int(os.environ.get("MAX_YOUTUBE_DURATION_SEC", "1200"))

ALLOWED_GLOSSERS = {"simple", "spacylemma", "rules"}
ALLOWED_MODES = {"text", "audio", "video", "youtube"}
ALLOWED_AVATARS = {"skeleton", "human"}

JOBS = {}
JOBS_LOCK = threading.Lock()

MODEL_PATH = (ROOT_DIR / "models" / "asl_best.keras").resolve()
MODEL_IMG_SIZE = 160
_MODEL = None
_MODEL_LOCK = threading.Lock()

DEFAULT_CLASS_NAMES = [
    "A", "B", "C", "D", "E", "F", "G", "H", "I", "J", "K", "L", "M",
    "N", "O", "P", "Q", "R", "S", "T", "U", "V", "W", "X", "Y", "Z",
]

app = FastAPI()
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.mount("/files", StaticFiles(directory=RUNS_DIR), name="files")


def _now_ts():
    return time.strftime("%H:%M:%S")


def _make_steps():
    return [
        {"id": "receive_input", "label": "Reception des entrees", "status": "pending", "ts": None},
        {"id": "transcribe", "label": "Transcription audio/video", "status": "pending", "ts": None},
        {"id": "text_to_gloss", "label": "Texte -> Glosses", "status": "pending", "ts": None},
        {"id": "gloss_to_pose", "label": "Glosses -> Pose", "status": "pending", "ts": None},
        {"id": "render_video", "label": "Rendu video", "status": "pending", "ts": None},
    ]


def _update_job(job_id: str, **updates):
    with JOBS_LOCK:
        if job_id not in JOBS:
            return
        JOBS[job_id].update(updates)


def _set_step(job_id: str, step_id: str, status: str):
    with JOBS_LOCK:
        job = JOBS.get(job_id)
        if not job:
            return
        for step in job["steps"]:
            if step["id"] == step_id:
                step["status"] = status
                step["ts"] = _now_ts()
                break


def _set_progress(job_id: str, progress: int):
    _update_job(job_id, progress=max(0, min(100, int(progress))))


def _get_ffmpeg_path():
    try:
        from imageio_ffmpeg import get_ffmpeg_exe

        return get_ffmpeg_exe()
    except Exception:
        return shutil.which("ffmpeg")


def _get_class_names():
    raw = os.environ.get("ASL_CLASS_NAMES", "").strip()
    if not raw:
        return DEFAULT_CLASS_NAMES
    parts = [p.strip() for p in raw.split(",") if p.strip()]
    return parts or DEFAULT_CLASS_NAMES


def _resolve_edge_indices(header, component, limb) -> tuple[int, int]:
    a, b = limb
    if isinstance(a, str) or isinstance(b, str):
        a_idx = header._get_point_index(component.name, a)
        b_idx = header._get_point_index(component.name, b)
        return a_idx, b_idx

    if max(a, b) < len(component.points):
        a_idx = header._get_point_index(component.name, component.points[a])
        b_idx = header._get_point_index(component.name, component.points[b])
        return a_idx, b_idx

    return int(a), int(b)


def _pose_edges(pose: Pose) -> list[list[int]]:
    edges = []
    header = pose.header
    for component in header.components:
        for limb in component.limbs:
            a_idx, b_idx = _resolve_edge_indices(header, component, limb)
            edges.append([int(a_idx), int(b_idx)])
    return edges


def _sanitize_float(value: float) -> float:
    """Replace NaN and infinity with 0.0 for JSON serialization."""
    return 0.0 if not math.isfinite(value) else value


def _pose_bounds(points: np.ndarray, conf: np.ndarray) -> tuple[float, float, float, float]:
    valid = conf > 0
    if not np.any(valid):
        return -1.0, 1.0, -1.0, 1.0
    xs = points[..., 0][valid]
    ys = points[..., 1][valid]
    return float(xs.min()), float(xs.max()), float(ys.min()), float(ys.max())


def _pose_to_json(pose: Pose, stride: int = 2):
    stride = max(1, int(stride))
    points = pose.body.data[:, 0, :, :2]
    conf = pose.body.confidence[:, 0, :]
    points = points[::stride]
    conf = conf[::stride]

    min_x, max_x, min_y, max_y = _pose_bounds(points, conf)
    frames = []
    for frame_points, frame_conf in zip(points, conf):
        frame = []
        for point, c in zip(frame_points, frame_conf):
            x = _sanitize_float(float(point[0]))
            y = _sanitize_float(float(point[1]))
            confidence = _sanitize_float(float(c))
            frame.append([x, y, confidence])
        frames.append(frame)

    return {
        "frames": frames,
        "edges": _pose_edges(pose),
        "bounds": {
            "min_x": _sanitize_float(min_x),
            "max_x": _sanitize_float(max_x),
            "min_y": _sanitize_float(min_y),
            "max_y": _sanitize_float(max_y)
        },
        "fps": _sanitize_float(float(getattr(pose, "fps", 24.0) or 24.0)),
    }


def _get_model():
    global _MODEL
    if _MODEL is None:
        with _MODEL_LOCK:
            if _MODEL is None:
                try:
                    import tensorflow as tf
                except ImportError as exc:
                    raise RuntimeError(
                        "Missing dependency: tensorflow. Install it in backend/requirements.txt."
                    ) from exc
                if not MODEL_PATH.exists():
                    raise RuntimeError(f"Model not found: {MODEL_PATH}")
                _MODEL = tf.keras.models.load_model(str(MODEL_PATH))
    return _MODEL


def _extract_audio(video_path: Path, audio_path: Path):
    ffmpeg = _get_ffmpeg_path()
    if not ffmpeg:
        raise RuntimeError("ffmpeg not found. Install ffmpeg or imageio-ffmpeg.")
    cmd = [
        ffmpeg,
        "-y",
        "-i",
        str(video_path),
        "-vn",
        "-acodec",
        "pcm_s16le",
        "-ar",
        "16000",
        "-ac",
        "1",
        str(audio_path),
    ]
    subprocess.run(cmd, check=True, capture_output=True)


_WHISPER_MODEL = None
_WHISPER_LOCK = threading.Lock()


def _get_whisper_model():
    global _WHISPER_MODEL
    if _WHISPER_MODEL is None:
        with _WHISPER_LOCK:
            if _WHISPER_MODEL is None:
                try:
                    import whisper
                except ImportError as exc:
                    raise RuntimeError(
                        "Missing dependency: openai-whisper. Install it in backend/requirements.txt."
                    ) from exc
                model_name = os.environ.get("WHISPER_MODEL", "base")
                _WHISPER_MODEL = whisper.load_model(model_name)
    return _WHISPER_MODEL


def _transcribe_audio(audio_path: Path, language: Optional[str] = None) -> str:
    model = _get_whisper_model()
    kwargs = {}
    if language:
        kwargs["language"] = language
    result = model.transcribe(str(audio_path), **kwargs)
    text = (result.get("text") or "").strip()
    if not text:
        raise RuntimeError("Transcription failed or empty.")
    return text


def _text_to_gloss(text: str, language: str, glosser: str, signed_language: str):
    if glosser not in ALLOWED_GLOSSERS:
        raise RuntimeError(f"Unsupported glosser: {glosser}")
    module = __import__(f"spoken_to_signed.text_to_gloss.{glosser}", fromlist=["text_to_gloss"])
    return module.text_to_gloss(text=text, language=language, signed_language=signed_language)


def _gloss_to_pose(sentences, lexicon: Path, spoken_language: str, signed_language: str):
    lookup = _get_pose_lookup(lexicon)
    poses = [gloss_to_pose(gloss, lookup, spoken_language, signed_language) for gloss in sentences]
    if len(poses) == 1:
        return poses[0]
    return concatenate_poses(poses, trim=False)


def _glosses_to_string(sentences):
    parts = []
    for sentence in sentences:
        part = " ".join([f"{word}/{gloss}" for word, gloss in sentence])
        parts.append(part)
    return " | ".join(parts)


_POSE_LOOKUP_CACHE = {}
_POSE_LOOKUP_LOCK = threading.Lock()


def _get_pose_lookup(lexicon: Path):
    lexicon_key = str(lexicon.resolve())
    with _POSE_LOOKUP_LOCK:
        cached = _POSE_LOOKUP_CACHE.get(lexicon_key)
        if cached is not None:
            return cached
        fingerspelling = FingerspellingPoseLookup()
        lookup = CSVPoseLookup(str(lexicon), backup=fingerspelling)
        _POSE_LOOKUP_CACHE[lexicon_key] = lookup
        return lookup


def _is_youtube_url(url: str) -> bool:
    try:
        parsed = urllib.parse.urlparse(url)
    except Exception:
        return False
    if parsed.scheme not in {"http", "https"}:
        return False
    host = (parsed.hostname or "").lower()
    return host.endswith("youtube.com") or host.endswith("youtu.be")


def _prepare_image(data: bytes):
    img = Image.open(io.BytesIO(data)).convert("RGB")
    img = img.resize((MODEL_IMG_SIZE, MODEL_IMG_SIZE))
    arr = np.array(img, dtype=np.float32)
    arr = np.expand_dims(arr, axis=0)
    return arr


def _get_youtube_info(url: str):
    try:
        import yt_dlp
    except ImportError as exc:
        raise RuntimeError("Missing dependency: yt-dlp. Install it in backend/requirements.txt.") from exc

    ydl_opts = {
        "quiet": True,
        "no_warnings": True,
        "skip_download": True,
        "noplaylist": True,
    }
    with yt_dlp.YoutubeDL(ydl_opts) as ydl:
        return ydl.extract_info(url, download=False)


def _pick_caption_lang(captions: dict, preferred: Optional[str]) -> Optional[str]:
    if not captions:
        return None
    if preferred:
        preferred = preferred.lower()
        if preferred in captions:
            return preferred
        for key in captions.keys():
            key_l = key.lower()
            if key_l.startswith(preferred) or preferred in key_l:
                return key
    for fallback in ("en", "fr", "es"):
        if fallback in captions:
            return fallback
    return next(iter(captions.keys()), None)


def _pick_caption_track(tracks: list) -> Optional[dict]:
    if not tracks:
        return None
    preferred_exts = ("vtt", "srt", "ttml", "srv3", "srv1")
    for ext in preferred_exts:
        for track in tracks:
            if track.get("ext") == ext:
                return track
    return tracks[0]


def _download_caption_text(info: dict, preferred_language: Optional[str]) -> Optional[str]:
    subtitles = info.get("subtitles") or {}
    auto = info.get("automatic_captions") or {}

    for source in (subtitles, auto):
        lang = _pick_caption_lang(source, preferred_language)
        if not lang:
            continue
        track = _pick_caption_track(source.get(lang) or [])
        if not track:
            continue
        url = track.get("url")
        if not url:
            continue
        try:
            request = urllib.request.Request(
                url,
                headers={
                    "User-Agent": "Mozilla/5.0",
                },
            )
            with urllib.request.urlopen(request, timeout=20) as response:
                payload = response.read().decode("utf-8", errors="ignore")
        except Exception:
            continue
        text = _caption_payload_to_text(payload)
        if text:
            return text
    return None


def _caption_payload_to_text(payload: str) -> str:
    if not payload:
        return ""
    lines = []
    for raw in payload.splitlines():
        line = raw.strip()
        if not line:
            continue
        if line.startswith("WEBVTT"):
            continue
        if "-->" in line:
            continue
        if line.isdigit():
            continue
        if line.startswith("NOTE") or line.startswith("STYLE") or line.startswith("REGION"):
            continue
        line = re.sub(r"<[^>]+>", "", line)
        line = line.strip()
        if line:
            lines.append(line)
    return " ".join(lines).strip()


def _download_youtube_audio(url: str, output_path: Path) -> Path:
    try:
        import yt_dlp
    except ImportError as exc:
        raise RuntimeError("Missing dependency: yt-dlp. Install it in backend/requirements.txt.") from exc

    output_template = f"{output_path}.%(ext)s"
    ydl_opts = {
        "quiet": True,
        "no_warnings": True,
        "noplaylist": True,
        "format": "bestaudio/best",
        "outtmpl": output_template,
        "postprocessors": [
            {
                "key": "FFmpegExtractAudio",
                "preferredcodec": "wav",
            }
        ],
        "postprocessor_args": ["-ar", "16000", "-ac", "1"],
    }
    ffmpeg_location = _get_ffmpeg_path()
    if ffmpeg_location:
        ydl_opts["ffmpeg_location"] = ffmpeg_location
    with yt_dlp.YoutubeDL(ydl_opts) as ydl:
        ydl.download([url])
    wav_path = output_path.with_suffix(".wav")
    if not wav_path.exists():
        raise RuntimeError("Failed to download audio from YouTube.")
    return wav_path


def _resolve_max_duration(max_duration_sec: Optional[int]) -> Optional[int]:
    if max_duration_sec is None:
        max_duration_sec = DEFAULT_MAX_YOUTUBE_DURATION_SEC
    if max_duration_sec is None:
        return None
    if max_duration_sec <= 0:
        return None
    return max_duration_sec


def _process_job(
    job_id: str,
    mode: str,
    text: Optional[str],
    input_path: Optional[Path],
    spoken_language: str,
    signed_language: str,
    glosser: str,
    avatar_type: str,
    lexicon: Path,
    youtube_url: Optional[str] = None,
    prefer_captions: bool = True,
    caption_language: Optional[str] = None,
    max_duration_sec: Optional[int] = None,
):
    current_step = "receive_input"
    try:
        _update_job(job_id, status="running", error=None)
        _set_step(job_id, "receive_input", "done")
        _set_progress(job_id, 5)

        transcript = text or ""
        effective_mode = mode

        if mode == "youtube":
            if not youtube_url:
                raise RuntimeError("YouTube URL is required.")
            if not _is_youtube_url(youtube_url):
                raise RuntimeError("Invalid YouTube URL.")

            info = _get_youtube_info(youtube_url)
            duration = info.get("duration")
            max_duration = _resolve_max_duration(max_duration_sec)
            if max_duration and duration and duration > max_duration:
                raise RuntimeError("YouTube video is too long for processing.")

            caption_text = None
            if prefer_captions:
                caption_text = _download_caption_text(info, caption_language or spoken_language)

            if caption_text:
                transcript = caption_text
                effective_mode = "text"
                _set_step(job_id, "transcribe", "skipped")
                _set_progress(job_id, 20)
            else:
                job_dir = RUNS_DIR / job_id
                job_dir.mkdir(parents=True, exist_ok=True)
                input_path = _download_youtube_audio(youtube_url, job_dir / "input")
                effective_mode = "audio"

        if effective_mode in {"audio", "video"}:
            current_step = "transcribe"
            _set_step(job_id, "transcribe", "running")
            _set_progress(job_id, 15)
            if input_path is None or not input_path.exists():
                raise RuntimeError("Input file missing.")

            audio_path = input_path
            if effective_mode == "video":
                audio_path = input_path.with_suffix(".wav")
                _extract_audio(input_path, audio_path)

            transcript = _transcribe_audio(audio_path, spoken_language)
            _set_step(job_id, "transcribe", "done")
            _set_progress(job_id, 35)
        else:
            if mode != "youtube":
                _set_step(job_id, "transcribe", "skipped")
                _set_progress(job_id, 20)

        if not transcript.strip():
            raise RuntimeError("No text to process after transcription.")

        current_step = "text_to_gloss"
        _set_step(job_id, "text_to_gloss", "running")
        _set_progress(job_id, 40)
        sentences = _text_to_gloss(transcript, spoken_language, glosser, signed_language)
        gloss_string = _glosses_to_string(sentences)
        _set_step(job_id, "text_to_gloss", "done")
        _set_progress(job_id, 55)

        current_step = "gloss_to_pose"
        _set_step(job_id, "gloss_to_pose", "running")
        _set_progress(job_id, 65)
        pose = _gloss_to_pose(sentences, lexicon, spoken_language, signed_language)
        pose_path = RUNS_DIR / job_id / "output.pose"
        with open(pose_path, "wb") as f:
            pose.write(f)
        _set_step(job_id, "gloss_to_pose", "done")
        _set_progress(job_id, 80)

        current_step = "render_video"
        _set_step(job_id, "render_video", "running")
        _set_progress(job_id, 90)
        video_path = RUNS_DIR / job_id / "output.mp4"
        style = "clean" if avatar_type == "skeleton" else "avatar"
        pose_to_skeleton_video(
            pose_path=str(pose_path),
            video_path=str(video_path),
            fps=0,
            width=640,
            height=480,
            style=style,
            female=False,
        )
        _set_step(job_id, "render_video", "done")
        _set_progress(job_id, 100)

        result = {
            "text": transcript,
            "gloss": gloss_string,
            "files": {
                "pose": f"/files/{job_id}/output.pose",
                "video": f"/files/{job_id}/output.mp4",
            },
        }
        _update_job(job_id, status="completed", result=result)
    except Exception as exc:
        _set_step(job_id, current_step, "error")
        _update_job(job_id, status="failed", error=str(exc))
        traceback.print_exc()


@app.get("/health")
def health():
    return {"ok": True}


@app.post("/recognize")
async def recognize(file: UploadFile = File(...)):
    try:
        data = await file.read()
        if not data:
            raise HTTPException(status_code=400, detail="Empty file.")
        arr = _prepare_image(data)
        model = _get_model()
        preds = model.predict(arr, verbose=0)[0]
        if preds is None or len(preds) == 0:
            raise HTTPException(status_code=500, detail="Model returned empty output.")
        class_names = _get_class_names()
        best_idx = int(np.argmax(preds))
        label = class_names[best_idx] if best_idx < len(class_names) else str(best_idx)
        confidence = float(preds[best_idx])
        top_idx = np.argsort(preds)[::-1][:3]
        top3 = []
        for idx in top_idx:
            idx = int(idx)
            top3.append(
                {
                    "label": class_names[idx] if idx < len(class_names) else str(idx),
                    "score": float(preds[idx]),
                }
            )
        return {"label": label, "confidence": confidence, "top3": top3}
    except HTTPException:
        raise
    except Exception as exc:
        raise HTTPException(status_code=500, detail=str(exc)) from exc


@app.get("/pose-json/{job_id}")
def pose_json(job_id: str, stride: int = 2):
    pose_path = RUNS_DIR / job_id / "output.pose"
    if not pose_path.exists():
        raise HTTPException(status_code=404, detail="Pose file not found.")
    with open(pose_path, "rb") as f:
        pose = Pose.read(f.read())
    return _pose_to_json(pose, stride=stride)


@app.post("/jobs")
async def create_job(
    background_tasks: BackgroundTasks,
    mode: str = Form(...),
    text: Optional[str] = Form(None),
    file: Optional[UploadFile] = File(None),
    youtube_url: Optional[str] = Form(None),
    prefer_captions: bool = Form(True),
    caption_language: Optional[str] = Form(None),
    max_duration_sec: Optional[int] = Form(None),
    spoken_language: str = Form("en"),
    signed_language: str = Form("ase"),
    glosser: str = Form("simple"),
    avatar_type: str = Form("skeleton"),
    lexicon: Optional[str] = Form(None),
):
    if mode not in ALLOWED_MODES:
        raise HTTPException(status_code=400, detail=f"Unsupported mode: {mode}")
    if glosser not in ALLOWED_GLOSSERS:
        raise HTTPException(status_code=400, detail=f"Unsupported glosser: {glosser}")
    if avatar_type not in ALLOWED_AVATARS:
        raise HTTPException(status_code=400, detail=f"Unsupported avatar type: {avatar_type}")

    if mode == "text" and not (text or "").strip():
        raise HTTPException(status_code=400, detail="Text input is required for text mode.")
    if mode in {"audio", "video"} and file is None:
        raise HTTPException(status_code=400, detail="File is required for audio/video mode.")
    if mode == "youtube":
        if not youtube_url:
            raise HTTPException(status_code=400, detail="YouTube URL is required for youtube mode.")
        if not _is_youtube_url(youtube_url):
            raise HTTPException(status_code=400, detail="Invalid YouTube URL.")

    job_id = uuid.uuid4().hex
    job_dir = RUNS_DIR / job_id
    job_dir.mkdir(parents=True, exist_ok=True)

    input_path = None
    if file is not None:
        suffix = Path(file.filename or "").suffix or ".bin"
        input_path = job_dir / f"input{suffix}"
        with open(input_path, "wb") as f:
            shutil.copyfileobj(file.file, f)

    if lexicon:
        lexicon_path = Path(lexicon)
        if not lexicon_path.is_absolute():
            lexicon_path = (ROOT_DIR / lexicon_path).resolve()
        else:
            lexicon_path = lexicon_path.resolve()
    else:
        lexicon_path = DEFAULT_LEXICON
    if not lexicon_path.exists():
        raise HTTPException(status_code=400, detail=f"Lexicon path not found: {lexicon_path}")

    job = {
        "id": job_id,
        "status": "queued",
        "progress": 0,
        "steps": _make_steps(),
        "result": None,
        "error": None,
    }
    with JOBS_LOCK:
        JOBS[job_id] = job

    background_tasks.add_task(
        _process_job,
        job_id,
        mode,
        text,
        input_path,
        spoken_language,
        signed_language,
        glosser,
        avatar_type,
        lexicon_path,
        youtube_url,
        prefer_captions,
        caption_language,
        max_duration_sec,
    )

    return job


@app.get("/jobs/{job_id}")
def get_job(job_id: str):
    with JOBS_LOCK:
        job = JOBS.get(job_id)
        if not job:
            raise HTTPException(status_code=404, detail="Job not found")
        return job
