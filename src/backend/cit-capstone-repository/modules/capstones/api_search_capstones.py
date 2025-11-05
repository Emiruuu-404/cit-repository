from typing import Dict

from fastapi import Depends, FastAPI, Query
from sqlalchemy import bindparam, text
from sqlalchemy.orm import Session

from db import get_db
from rag.retrieval import hybrid_retrieve


def register_api_search_capstones_routes(app: FastAPI):
    @app.get("/api/search")
    def search(q: str = Query(...), k: int = 12, db: Session = Depends(get_db)):
        hits = hybrid_retrieve(db, q, k=k)
        grouped: Dict[int, Dict] = {}
        for h in hits:
            grouped.setdefault(h["project_id"], {"title": h["title"], "similarity": h["sim"], "year": h["year"], "snippets": []})
            grouped[h["project_id"]]["snippets"].append(h["content"])
        project_ids = list(grouped.keys())

        authors_map: Dict[int, list] = {}
        category_map: Dict[int, str] = {}

        if project_ids:
            author_rows = db.execute(
                text("SELECT project_id, full_name FROM authors WHERE project_id IN :pids").bindparams(
                    bindparam("pids", value=project_ids, expanding=True)
                )
            ).fetchall()
            for project_id, full_name in author_rows:
                authors_map.setdefault(project_id, []).append(full_name)

            project_rows = db.execute(
                text("SELECT id, course, doc_type FROM projects WHERE id IN :pids").bindparams(
                    bindparam("pids", value=project_ids, expanding=True)
                )
            ).fetchall()
            for row in project_rows:
                data = row._mapping
                category_map[data["id"]] = data["doc_type"] or data["course"]

        results = []
        for pid, meta in grouped.items():
            results.append({
                "project_id": pid,
                "title": meta["title"],
                "similarity": meta["similarity"],
                "year": meta["year"],
                "snippets": meta["snippets"],
                "authors": authors_map.get(pid, []),
                "category": category_map.get(pid),
            })
        return {"query": q, "results": results}
