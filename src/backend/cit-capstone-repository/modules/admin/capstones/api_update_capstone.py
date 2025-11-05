from http.client import HTTPException
from fastapi import FastAPI, File, Form, UploadFile
from fastapi.params import Depends
from sqlalchemy import text
from db import get_db
from helpers.pdf import PdfHelper
from helpers.session import require_role
from dtos import CapstoneResponse
from models import Author, Project, ProjectKeyword
from sqlalchemy.orm import Session


def register_api_update_capstone_route(app: FastAPI):
    
    @app.put("/api/capstones/{capstone_id}", response_model=CapstoneResponse)
    async def update_capstone(
        capstone_id: int,
        title: str = Form(...),
        abstract: str = Form(None),
        authors: str = Form(...),
        keywords: str = Form(...),
        year: int = Form(...),
        external_links: str = Form(None),
        db: Session = Depends(get_db),
        claims=Depends(require_role(["Admin", "Staff"]))
    ):
        capstone = db.query(Project).filter(Project.id == capstone_id).first()
        if not capstone:
            raise HTTPException(status_code=404, detail="Capstone not found")

        capstone.title = title
        capstone.abstract = abstract
        capstone.year = year
        capstone.external_links = external_links
        
        db.query(Author).filter_by(project_id=capstone.id).delete()
        for author in authors.split(','):
            author = author.strip()
            db.add(Author(project_id=capstone.id, full_name=author))
                
        db.query(ProjectKeyword).filter_by(project_id=capstone.id).delete()
        for keyword in keywords.split(','):
            keyword = keyword.strip()
            db.add(ProjectKeyword(project_id=capstone.id, keyword=keyword))
        
        db.commit()
        db.refresh(capstone)
        
        authors = [r[0] for r in db.execute(text("SELECT full_name FROM authors WHERE project_id=:pid"), {"pid": capstone.id}).fetchall()]
        keywords = [r[0] for r in db.execute(text("SELECT keyword FROM project_keywords WHERE project_id=:pid"), {"pid": capstone.id}).fetchall()]
        
        return {
            "id": capstone.id, 
            "title": title, 
            "year": year, 
            "abstract": abstract,
            "external_links": external_links,
            "authors": authors,
            "keywords": keywords
        }

