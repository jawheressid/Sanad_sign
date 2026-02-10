# Pose-to-Video

Convertit un fichier `.pose` en vidéo avec le modèle Pix2Pix.

## Installation

```bash
pip install numpy opencv-python pose-format tqdm mediapipe "tensorflow<=2.15.0"
```

## Utilisation

```bash
python -m pose_to_video.bin --type=pix2pix --model=pix_to_pix.h5 --pose=input.pose --video=output.mp4
```

## Datasets

- [SHHQ](data/SHHQ) - images humaines haute qualité

