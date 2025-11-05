import re
from typing import List

def sentence_chunks(text: str, target_chars=1200) -> List[str]:
    sents = re.split(r"(?<=[.!?])\s+(?=[A-Z(])", (text or "").strip())
    chunks, buf = [], ""
    for s in sents:
        if len(buf) + len(s) + 1 <= target_chars:
            buf = f"{buf} {s}".strip()
        else:
            if buf: chunks.append(buf)
            buf = s
    if buf: chunks.append(buf)
    return [c for c in chunks if len(c) > 20]

def split_names(raw: str) -> List[str]:
    parts = re.split(r",|\band\b|;", raw, flags=re.I)
    names, seen = [], set()
    for p in parts:
        t = re.sub(r"\s+", " ", p).strip(" .,-")
        if t and " " in t and len(t) > 2 and t.lower() not in seen:
            seen.add(t.lower()); names.append(t)
    return names

def split_keywords(raw: str) -> List[str]:
    parts = re.split(r",|;|\|", raw)
    kws, seen = [], set()
    for p in parts:
        t = re.sub(r"\s+", " ", p).strip(" .,-")
        if t and t.lower() not in seen:
            seen.add(t.lower()); kws.append(t)
    return kws

