from __future__ import annotations

from pathlib import Path
import sys
from typing import Dict, List

import numpy as np
from sqlalchemy.orm import Session
from sqlalchemy import bindparam, text

BASE_DIR = Path(__file__).resolve().parent.parent
if str(BASE_DIR) not in sys.path:
    sys.path.insert(0, str(BASE_DIR))

from helpers.embeddings import embed_texts, unpack_vector

def cosine_sim(a: np.ndarray, b: np.ndarray) -> float:
    return float(np.dot(a, b))

def _fts_quote(term: str) -> str:
    """Wrap user input for FTS5 MATCH safely by quoting and escaping."""
    return f'"{term.replace("\"", "\"\"")}"' if term else term


def hybrid_retrieve(db: Session, query: str, k: int = 12, limit: int = 10) -> List[Dict]:
    safe_query = _fts_quote(query)
    # FTS5 (project-level)
    fts_rows = db.execute(
        text("""SELECT project_id, bm25(projects_fts) AS score
                FROM projects_fts WHERE projects_fts MATCH :q
                ORDER BY score LIMIT :limit"""), {"q": safe_query or query, "limit": limit}
    ).fetchall()
    fts_ids = {row[0] for row in fts_rows}

    # Embedding scan (good for small/medium corpora)
    chunk_rows = db.execute(text("SELECT chunk_id, vector FROM embeddings")).fetchall()
    if not chunk_rows:
        return []
    qvec = embed_texts([query])[0]
    scored = [(cid, cosine_sim(qvec, unpack_vector(vec))) for cid, vec in chunk_rows]
    scored.sort(key=lambda x: x[1], reverse=True)
    top = scored[:k]

    rows = db.execute(
        text("""SELECT c.id, c.content, c.project_id, c.section_id, p.title, p.year
                FROM chunks c JOIN projects p ON p.id = c.project_id
                WHERE c.id IN :ids""").bindparams(
                    bindparam("ids", value=[cid for cid, _ in top], expanding=True)
                )
    ).fetchall()
    meta = {r[0]: r for r in rows}

    results = []
    for cid, sim in top:
        if cid in meta:
            _, content, pid, sid, title, year = meta[cid]
            sim += 0.05 if pid in fts_ids else 0.0
            results.append({"chunk_id": cid, "content": content, "project_id": pid,
                            "section_id": sid, "title": title, "year": year, "sim": sim})
    results.sort(key=lambda x: x["sim"], reverse=True)
    return results[:k]
