import io
from typing import List, Dict
import docx
from helpers.regex import FIELD_LABELS
from helpers.text import split_keywords, split_names

def parse_compilation_docx(file_bytes: bytes) -> List[Dict]:
    """
    Return entries extracted from a .docx compilation:
    [{
      'title': str|None,
      'researchers': [str],
      'course': str|None,
      'host': str|None,
      'doc_type': str|None,
      'keywords': [str],
      'abstract': str
    }, ...]
    """
    buf = io.BytesIO(file_bytes)
    document = docx.Document(buf)
    paras = [p.text.strip() for p in document.paragraphs if p.text and p.text.strip()]

    entries, cur = [], {
        "title": None, "researchers": [], "course": None, "host": None,
        "doc_type": None, "keywords": [], "abstract": [], "year": None
    }

    def flush():
        if cur["title"] or cur["abstract"]:
            entries.append({
                "title": cur["title"],
                "researchers": cur["researchers"],
                "course": cur["course"],
                "host": cur["host"],
                "doc_type": cur["doc_type"],
                "keywords": cur["keywords"],
                "year": cur["year"] or None,
                "abstract": "\n\n".join(cur["abstract"]).strip()
            })

    for line in paras:
        m = FIELD_LABELS["title"].match(line)
        if m:
            if cur["title"] or cur["abstract"]:
                flush()
                cur = {"title": None, "researchers": [], "course": None, "host": None,
                       "doc_type": None, "keywords": [], "abstract": [], "year": None}
            cur["title"] = m.group(1).strip(); continue

        for key in ("researchers","course","host","doc_type","keywords","year"):
            m = FIELD_LABELS[key].match(line)
            if m:
                val = m.group(1)
                if key == "researchers": cur["researchers"] = split_names(val)
                elif key == "keywords": cur["keywords"] = split_keywords(val)
                else: cur[key] = val.strip()
                break
        else:
            cur["abstract"].append(line)

    flush()
    return entries
