from .types import Gloss


def text_to_gloss(text: str, language: str, **kwargs) -> list[Gloss]:
    raise NotImplementedError(
        "NMT glosser is disabled in this project variant. Only French and English are supported."
    )
