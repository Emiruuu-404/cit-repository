
from fileinput import filename
from fastapi import FastAPI, UploadFile
from fastapi import Form
from fastapi.params import Depends

from db import get_db, insert_fts_row
from helpers.embeddings import embed_texts, pack_vector
from helpers.hash import sha256_bytes
from helpers.pdf import PdfHelper
from helpers.session import require_role
from dtos import CapstoneResponse
from sqlalchemy.orm import Session

from helpers.text import sentence_chunks
from models import Author, Chunk, Embedding, Project, ProjectKeyword, Section


def register_api_create_capstone_route(app: FastAPI):
    @app.post("/api/capstones")
    async def create_capstone(
        title: str = Form(...),
        abstract: str = Form(None),
        authors: str = Form(...),
        keywords: str = Form(...),
        year: int = Form(...),
        external_links: str = Form(None),
        db: Session = Depends(get_db),
        claims=Depends(require_role(["Admin", "Staff"]))
    ):
        
        basis = (title or "") + "|" + authors + "|" + abstract[:1000]
        sha = sha256_bytes(basis.encode("utf-8"))
        
        existing = db.query(Project).filter_by(sha256=sha).one_or_none()
        if existing:
            return {
                "status": "error",
                "message": "Project already exists"
            }
        
        capstone = Project(
            sha256=sha, filename="default.docx", title=title, year=year, abstract=abstract,
            external_links=external_links,
            course="BSIT", host="CBSUA", doc_type="Capstone Project"
        )
        db.add(capstone); db.flush()
        
        for a in authors.split(','):
            a = a.strip()
            db.add(Author(project_id=capstone.id, full_name=a))
            
        for k in keywords.split(','):
            k = k.strip()
            db.add(ProjectKeyword(project_id=capstone.id, keyword=k))
        
        # index abstract as a section with chunks + embeddings
        if abstract:
            sec = Section(project_id=capstone.id, heading="ABSTRACT", content=abstract, order_no=1)
            db.add(sec); db.flush()
            parts = sentence_chunks(abstract)
            if parts:
                vecs = embed_texts(parts)
                for j, (part, vec) in enumerate(zip(parts, vecs), start=1):
                    ch = Chunk(project_id=capstone.id, section_id=sec.id, content=part, ord_in_sec=j)
                    db.add(ch); db.flush()
                    db.add(Embedding(chunk_id=ch.id, vector=pack_vector(vec)))

        insert_fts_row(db, capstone.id, capstone.title or "", capstone.abstract or "", abstract or "")
        
        db.commit()
        db.refresh(capstone)
        return capstone
