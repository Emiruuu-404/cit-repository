from fastapi import Depends, FastAPI, HTTPException

from db import delete_fts_row, get_db
from helpers.pdf import PdfHelper
from helpers.session import require_role
from models import Author, Chunk, Embedding, Project, ProjectKeyword, Section
from sqlalchemy.orm import Session


def register_api_delete_capstone_route(app: FastAPI):
    
    @app.delete("/api/capstones/{capstone_id}")
    def delete_capstone(capstone_id: int, db: Session = Depends(get_db), claims=Depends(require_role(["Admin", "Staff"]))):
        capstone = db.query(Project).filter(Project.id == capstone_id).first()
        if not capstone:
            raise HTTPException(status_code=404, detail="Capstone not found")
            
        delete_fts_row(db, capstone.id)
        db.query(Author).filter_by(project_id=capstone.id).delete()
        db.query(ProjectKeyword).filter_by(project_id=capstone.id).delete()
        db.query(Embedding).filter(Embedding.chunk_id.in_(
            db.query(Chunk.id).filter_by(project_id=capstone.id)
        )).delete(synchronize_session=False)
        db.query(Chunk).filter_by(project_id=capstone.id).delete()
        db.query(Section).filter_by(project_id=capstone.id).delete()

        db.delete(capstone)
        db.commit()
        return {"message": "Capstone deleted successfully"}
