import sys

from .common import load_spacy_model
from .types import Gloss

LANGUAGE_MODELS_RULES = {
    "fr": ("fr_core_news_lg", "fr_core_news_md", "fr_core_news_sm"),
}


def print_token(token):
    print(
        token.text,
        token.ent_type_,
        token.lemma_,
        token.pos_,
        token.tag_,
        token.dep_,
        token.head,
        token.morph,
        file=sys.stderr,
    )


def attach_svp(tokens):
    for token in tokens:
        if token.pos_ == "VERB":
            token.lemma_ = token.lemma_.lower()
            if not token.lemma_.endswith("n"):
                token.lemma_ += "n"
        elif token.dep_ == "svp":
            token.head.lemma_ = token.lemma_ + token.head.lemma_


def get_clauses(tokens):
    def diff(l1, l2):
        return [x for x in l1 if x not in l2]

    verbs = [
        t
        for t in tokens
        if (t.pos_ == "VERB" and t.dep_ != "oc")
        or (t.pos_ == "AUX" and t.dep_ == "mo" and t.head.pos_ == "VERB")
        or t.dep_ == "ROOT"
    ]
    subtrees = [[t for t in v.subtree] for v in verbs]
    clauses = [s for s in subtrees]
    subtrees.sort(key=len, reverse=True)
    new_clauses = []
    for clause in clauses:
        new_clause = clause
        for s in subtrees:
            if len(s) < len(new_clause):
                diff_clause = diff(new_clause, s)
                if diff_clause:
                    new_clause = diff_clause
        new_clauses.append(new_clause)

    return new_clauses


def reorder_sub_main(clauses):
    sub_clause = -1
    main_clause = -1
    main_verb = None

    for i, clause in enumerate(clauses):
        for token in clause:
            if token.tag_ == "KOUS" and token.dep_ == "cp" and token.head.dep_ == "mo":
                main_verb = token.head.head
                sub_clause = i

    if sub_clause >= 0:
        assert main_verb is not None
        for j, clause in enumerate(clauses):
            if main_verb in clause:
                main_clause = j
        if sub_clause > main_clause:
            clauses[sub_clause], clauses[main_clause] = clauses[main_clause], clauses[sub_clause]

    return clauses


def get_triplets(pairs, word_order="sov"):
    triplets = []

    for i in range(len(pairs)):
        for j in range(i + 1, len(pairs)):
            if pairs[i][1] == pairs[j][1]:
                v = pairs[i][1]
                if pairs[i][0].dep_ in {"sb", "nsubj"}:
                    s = pairs[i][0]
                    o = pairs[j][0]
                else:
                    s = pairs[j][0]
                    o = pairs[i][0]
                if word_order == "sov":
                    triplets.append((s, o, v))
                elif word_order == "svo":
                    triplets.append((s, v, o))
                elif word_order == "osv":
                    triplets.append((o, s, v))

    return triplets


def swap(tokens, token_a, token_b):
    new_tokens = []

    if token_a.head == token_b:
        verb = token_b
        subtree = list(token_a.subtree)
        insubtree = False
        for t in tokens:
            if t == verb:
                continue
            if t in subtree:
                insubtree = True
            elif insubtree:
                new_tokens.append(verb)
                insubtree = False
            new_tokens.append(t)
        if insubtree:
            new_tokens.append(verb)

    elif token_b.head == token_a:
        verb = token_a
        subtree = list(token_b.subtree)
        put_a = False
        for t in tokens:
            if t == verb:
                continue
            if t in subtree and not put_a:
                new_tokens.append(verb)
                put_a = True
            new_tokens.append(t)
    else:
        subtree_a = list(token_a.subtree)
        subtree_b = list(token_b.subtree)
        put_a = False
        for t in [t for t in tokens if t not in subtree_a]:
            if t in subtree_b and not put_a:
                new_tokens.extend(subtree_a)
                put_a = True
            new_tokens.append(t)

    return new_tokens


def reorder_svo_triplets(clause, word_order="sov"):
    pairs = []
    for token in clause:
        if token.dep_ in {
            "sb",
            "oa",
            "nsubj",
            "obj",
            "obl:arg",
        }:
            pairs.append((token, token.head))

    reordered_triplets = get_triplets(pairs, word_order=word_order)
    if reordered_triplets:
        (token_a, token_b, token_c) = reordered_triplets[0]
        if (token_a.i < token_b.i) and (token_b.i < token_c.i):
            pass
        elif (token_a.i < token_b.i) and (token_b.i > token_c.i):
            clause = swap(clause, token_b, token_c)
        elif (token_a.i > token_b.i) and (token_a.i < token_c.i):
            clause = swap(clause, token_a, token_b)
        elif (token_a.i < token_b.i) and (token_a.i > token_c.i):
            print("# 2,3,1 => put 1 before", file=sys.stderr)
            pass
        elif (token_a.i > token_b.i) and (token_a.i > token_c.i):
            print("# 3,1,2 => put 3 after", file=sys.stderr)
            pass
        elif (token_a.i > token_b.i) and (token_b.i > token_c.i):
            clause = swap(clause, token_a, token_c)

    return clause


def haben_main_verb(token):
    if token.lemma_ in {"avoir", "etre", "être"}:
        for c in token.children:
            if c.pos_ == "VERB" and c.dep_ == "oc":
                return False
        return True

    return False


def gloss_de_poss_pronoun(token):
    # Possessive pronouns (language-specific)
    pposat_map = {
        "M": "mon",
        "m": "mon",
        "D": "ton",
        "d": "ton",
        "S": "son",
        "s": "son",
        "i": "votre",
        "I": "votre",
        "U": "notre",
        "u": "notre",
        "E": "votre",
        "e": "votre",
    }

    return "(" + pposat_map[token.text[0]] + ")"


def glossify(tokens):
    for t in tokens:

        gloss = t.lemma_

        if t.tag_ == "NN" and "Number=Plur" in t.morph:
            gloss += "+"

        elif t.pos_ == "ADV":
            gloss = t.text.lower()

        elif t.tag_ == "PPOSAT":
            gloss = gloss_de_poss_pronoun(t)

        elif t.tag_ in [
            "PPER",
            "PRF",
            "PDS",
            "PRON",
            "DET",
        ]:
            gloss = t.text.lower() + "-IX"

        elif haben_main_verb(t):
            gloss = "avoir"

        elif (
            t.lemma_ in {"avoir", "etre", "être"}
            or (t.lemma_ == "avoir" and t.pos_ == "AUX")
        ):
            continue

        yield (gloss, t.text)


def clause_to_gloss(clause, lang: str, punctuation=False) -> tuple[list[str], list[str]]:
    clause = reorder_svo_triplets(clause)

    tokens = [
        t
        for t in clause
        if t.pos_ in {"NOUN", "VERB", "PROPN", "ADJ", "NUM", "AUX", "SCONJ", "X"}
        or (punctuation and t.pos_ == "PUNCT")
        or (t.pos_ == "ADV" and t.dep_ != "svp")
        or (t.pos_ == "PRON" and t.dep_ != "ep")
        or (t.dep_ == "ng")
        or (t.lemma_ == "aucun")
        or (t.tag_ in {"PTKNEG", "KON", "PPOSAT"})
        or (t.tag_ == "DET" and "Poss=Yes" in t.morph)
        or (t.tag_ == "CCONJ")
    ]

    if punctuation:
        for t in tokens:
            if t.pos_ == "PUNCT":
                t.lemma_ = t.text

    adverbs = [t for t in tokens if t.pos_ == "ADV" and t.dep_ == "mo" and t.head.pos_ == "VERB"]
    tokens = [t for t in tokens if t not in adverbs]
    tokens = adverbs + tokens

    locations = [t for t in tokens if t.ent_type_ == "LOC"]
    tokens = [t for t in tokens if t not in locations]
    tokens = locations + tokens
    for i, t in enumerate(tokens):
        if t.dep_ == "compound":
            tokens[i] = t.head

    glosses, tokens = zip(*list(glossify(tokens)))

    return glosses, tokens


def text_to_gloss_given_spacy_model(text: str, spacy_model, lang: str = "fr", punctuation=False) -> dict:
    if text.strip() == "":
        return {"glosses": [], "tokens": [], "gloss_string": ""}

    doc = spacy_model(text)

    clauses = get_clauses(doc)

    clauses = reorder_sub_main(clauses)

    glosses_all_clauses = []
    tokens_all_clauses = []

    glossed_clauses = []

    for clause in clauses:
        glosses, tokens = clause_to_gloss(clause, lang, punctuation=punctuation)
        glosses_all_clauses.extend(glosses)
        tokens_all_clauses.extend(tokens)
        glossed_clauses.append({"glosses": glosses, "tokens": tokens})

    gloss_string = " | ".join([" ".join(list(clause["glosses"])) for clause in glossed_clauses])
    gloss_string += " ||"

    gloss_string = gloss_string.title()

    return {"glosses": glosses_all_clauses, "tokens": tokens_all_clauses, "gloss_string": gloss_string}


def text_to_gloss(text: str, language: str, punctuation=False, **unused_kwargs) -> list[Gloss]:
    if language not in LANGUAGE_MODELS_RULES:
        raise NotImplementedError(f"Don't know language '{language}'.")

    model_names = LANGUAGE_MODELS_RULES[language]

    spacy_model = load_spacy_model(model_names)
    output_dict = text_to_gloss_given_spacy_model(text, spacy_model=spacy_model, lang=language, punctuation=punctuation)

    glosses = output_dict["glosses"]
    tokens = output_dict["tokens"]

    return [list(zip(tokens, glosses))]
