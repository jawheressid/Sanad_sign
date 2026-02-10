# Spoken - pipeline texte/voix -> langue des signes

Projet complet avec:
- Frontend web (Next.js) pour l'UI.
- Backend API (FastAPI) pour orchestrer la pipeline.
- Moteur IA (pipeline gloss/pose/video) dans `AI/`.

## Architecture

```
[Frontend Next.js]
        |
        v
[Backend FastAPI] ---> fichiers temporaires (runs/)
        |
        v
[AI pipeline]
  1) Transcription (Whisper)
  2) Texte -> Glosses
  3) Glosses -> Pose
  4) Pose -> Video (optionnel)
```

## Technologies

- Frontend: Next.js, React, TypeScript, Tailwind CSS, Radix UI.
- Backend: FastAPI, Uvicorn, Python.
- IA: spoken-to-signed, pose-format, numpy/scipy, Whisper, TensorFlow.
- Video: imageio/imageio-ffmpeg (et optionnellement `pose-to-video`).

## Prerequis

- Python 3.9+.
- Node.js 18+.
- ffmpeg (optionnel, sinon `imageio-ffmpeg`).

## Installation

### 1) Backend + IA

```
python -m venv .venv
source .venv/bin/activate
pip install -r backend/requirements.txt
pip install -e AI
```

Optionnel pour les glossers spaCy:

```
pip install spacy
python -m spacy download fr_core_news_lg
python -m spacy download en_core_web_lg
```

Note: la generation video demande `pose-to-video` avec pix2pix et upscaler:

```
pip install 'pose-to-video[pix2pix,simple_upscaler] @ git+https://github.com/sign-language-processing/pose-to-video'
```

### 2) Frontend

```
cd front
npm install
```

## Lancement

### Backend

```
uvicorn backend.app:app --host 0.0.0.0 --port 8000 --reload
```

Variables d'environnement utiles:
- `WHISPER_MODEL` (defaut: `base`).
- `MAX_YOUTUBE_DURATION_SEC` (defaut: `1200`, `0` pour illimite).

### Frontend

```
cd front
pnpm dev
```

## Structure du projet

- `front/`: application web.
- `backend/`: API FastAPI et orchestration.
- `AI/`: pipeline IA (texte -> glosses -> pose -> video).
  - `AI/GEN pose to video/pose-to-video/`: module Pix2Pix pour convertir `.pose` en vidéo.
- `models/`: modeles locaux (ex: ASL).

## Pose to Video (Pix2Pix)

Convertit un fichier `.pose` en vidéo réaliste via Pix2Pix.

### Installation

```bash
pip install numpy opencv-python pose-format tqdm mediapipe "tensorflow<=2.15.0"
```

### Utilisation

```bash
cd "AI/GEN pose to video/pose-to-video"
python -m pose_to_video.bin --type=pix2pix --model=pix_to_pix.h5 --pose=input.pose --video=output.mp4
```

## Notes
- Installer tous les requirments
- Pipeline de reference: `texte -> glosses -> pose -> video`.
