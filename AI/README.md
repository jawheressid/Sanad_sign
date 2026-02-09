# Spoken to Signed (pipeline simple)

Pipeline simple: `texte -> glosses -> pose -> video` pour la traduction de langue parlée vers langue des signes.

- Demo disponible pour la LSF (French Sign Language).
- Article sur arXiv et présentation à AT4SSL 2023.

![Pipeline](assets/pipeline.jpg)

## Installation

```bash
pip install spoken-to-signed
```

## Utilisation rapide

Codes de langue: IANA Language Subtag Registry.

### Demo (lexique factice)

Dans Colab:

<a target="_blank" href="https://colab.research.google.com/drive/1UtBmfBIhUa2EdLMnWJr0hxAOZelQ50_9?usp=sharing">
  <img src="https://colab.research.google.com/assets/colab-badge.svg" alt="Open In Colab"/>
</a>

Ou en local:

```bash
git clone https://github.com/ZurichNLP/spoken-to-signed-translation
cd spoken-to-signed-translation

pip install .

text_to_gloss_to_pose \
  --text "Les enfants mangent une pizza à Zurich." \
  --glosser "simple" \
  --lexicon "assets/dummy_lexicon" \
  --spoken-language "fr" \
  --signed-language "fsl" \
  --pose "quick_test.pose"
```

## Scripts disponibles

### Texte -> Glosses

```bash
text_to_gloss \
  --text <input_text> \
  --glosser <simple|spacylemma|rules> \
  --spoken-language <fr|en> \
  --signed-language <fsl|ase>
```

### Texte -> Glosses -> Pose

```bash
text_to_gloss_to_pose \
  --text <input_text> \
  --glosser <simple|spacylemma|rules> \
  --lexicon <path_to_directory> \
  --spoken-language <fr|en> \
  --signed-language <fsl|ase> \
  --pose <output_pose_file_path>.pose
```

### Texte -> Glosses -> Pose -> Video

```bash
text_to_gloss_to_pose_to_video \
  --text <input_text> \
  --glosser <simple|spacylemma|rules> \
  --lexicon <path_to_directory> \
  --spoken-language <fr|en> \
  --signed-language <fsl|ase> \
  --video <output_video_file_path>.mp4
```

Note: la generation video demande `pose-to-video` avec pix2pix et upscaler:

```bash
pip install 'pose-to-video[pix2pix,simple_upscaler] @ git+https://github.com/sign-language-processing/pose-to-video'
```

## Langues supportees

| Langue | Code IANA | Glossers |
|---|---|---|
| French Sign Language | fsl | `simple`, `spacylemma`, `rules` |
| American Sign Language | ase | `simple`, `spacylemma` |

## Citation

```bib
@inproceedings{moryossef2023baseline,
  title={An Open-Source Gloss-Based Baseline for Spoken to Signed Language Translation},
  author={Moryossef, Amit and M{"u}ller, Mathias and G{"o}hring, Anne and Jiang, Zifan and Goldberg, Yoav and Ebling, Sarah},
  booktitle={2nd International Workshop on Automatic Translation for Signed and Spoken Languages (AT4SSL)},
  year={2023},
  month={June},
  url={https://github.com/ZurichNLP/spoken-to-signed-translation},
  note={Available at: \url{https://arxiv.org/abs/2305.17714}}
}
```
