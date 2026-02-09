# Backend API

This service connects the frontend to the Python AI pipeline in `AI/`.

## Install

1. Create and activate a virtual environment.
2. Install dependencies:
   - `pip install -r backend/requirements.txt`
   - For YouTube mode, install `ffmpeg` (or rely on `imageio-ffmpeg`).
3. Optional for spaCy glossers:
   - `pip install spacy`
   - `python -m spacy download fr_core_news_lg`
   - `python -m spacy download en_core_web_lg`

## Run

`uvicorn backend.app:app --host 0.0.0.0 --port 8000 --reload`

## Environment

- `WHISPER_MODEL` selects the whisper model, default is `base`.
- `MAX_YOUTUBE_DURATION_SEC` caps YouTube processing length (default `1200` seconds). Set to `0` to disable.

## Endpoints

- `POST /jobs` starts a conversion job.
- `GET /jobs/{id}` returns job status and results.
- `GET /files/{id}/output.mp4` serves the rendered video.

### YouTube mode

`POST /jobs` with `mode=youtube`:
- `youtube_url` (required)
- `prefer_captions` (optional, default true): use YouTube captions when available to skip Whisper.
- `caption_language` (optional): language code to pick captions (e.g. `en`, `fr`).
- `max_duration_sec` (optional): override the global duration cap.
