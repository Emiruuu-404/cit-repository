from fastapi import FastAPI, File, UploadFile
from fastapi.params import Depends
from db import get_db
from helpers.docx_parser import parse_compilation_docx
from rag.indexing import upsert_project_from_fields
from sqlalchemy.orm import Session
from http.client import HTTPException

def register_api_upload_docx_route(app: FastAPI):
    @app.post("/api/capstones/upload-docx")
    async def upload_docx(file: UploadFile = File(...), db: Session = Depends(get_db)):
        if not file.filename.lower().endswith(".docx"):
            raise HTTPException(400, "Only .docx files are accepted.")
        b = await file.read()
        if len(b) < 500:
            raise HTTPException(400, "DOCX too small or corrupt.")

        entries = parse_compilation_docx(b)
        if not entries:
            raise HTTPException(400, "No capstone entries detected.")

        created = []
        for e in entries:
            pid = upsert_project_from_fields(
                db, file.filename, b,
                title=e.get("title"),
                researchers=e.get("researchers", []),
                course=e.get("course"),
                host=e.get("host"),
                doc_type=e.get("doc_type"),
                keywords=e.get("keywords", []),
                abstract_text=e.get("abstract", ""),
                year=e.get("year", None)
            )
            created.append(pid)
        db.commit()
        return {"status": "ok", "inserted": created, "skipped": []}