from typing import List, Optional, Tuple
from sqlalchemy.orm import Session
from sqlalchemy import text

from db import get_db_session, insert_fts_row, delete_fts_row
from helpers.hash import sha256_bytes
from helpers.text import sentence_chunks
from helpers.embeddings import embed_texts, pack_vector
from models import Project, Author, ProjectKeyword, Section, Chunk, Embedding

def upsert_project_from_fields(
    db: Session,
    filename: str,
    file_bytes: bytes,
    *,
    title: Optional[str],
    researchers: List[str],
    course: Optional[str],
    host: Optional[str],
    doc_type: Optional[str],
    keywords: List[str],
    abstract_text: str,
    year: int
) -> int:
    # deterministic ID for this entry within the docx
    basis = (title or "") + "|" + ",".join(researchers) + "|" + abstract_text[:1000]
    sha = sha256_bytes(basis.encode("utf-8"))

    # store original .docx (once)
    from config import PathConfig
    UPLOAD_DIR = PathConfig.UPLOAD_DIR
    path = UPLOAD_DIR / f"{sha}.docx"
    if not path.exists():
        path.write_bytes(file_bytes)

    proj = db.query(Project).filter_by(sha256=sha).one_or_none()
    if proj:
        delete_fts_row(db, proj.id)
        db.query(Author).filter_by(project_id=proj.id).delete()
        db.query(ProjectKeyword).filter_by(project_id=proj.id).delete()
        db.query(Embedding).filter(Embedding.chunk_id.in_(
            db.query(Chunk.id).filter_by(project_id=proj.id)
        )).delete(synchronize_session=False)
        db.query(Chunk).filter_by(project_id=proj.id).delete()
        db.query(Section).filter_by(project_id=proj.id).delete()

        proj.filename = filename
        proj.title = title
        proj.year = None
        proj.abstract = abstract_text
        proj.course = course
        proj.host = host
        proj.doc_type = doc_type
        proj.year = year
    else:
        proj = Project(
            sha256=sha, filename=filename, title=title, year=year, abstract=abstract_text,
            course=course, host=host, doc_type=doc_type
        )
        db.add(proj); db.flush()

    for a in researchers:
        db.add(Author(project_id=proj.id, full_name=a))
    for k in keywords:
        db.add(ProjectKeyword(project_id=proj.id, keyword=k))

    # index abstract as a section with chunks + embeddings
    if abstract_text:
        sec = Section(project_id=proj.id, heading="ABSTRACT", content=abstract_text, order_no=1)
        db.add(sec); db.flush()
        parts = sentence_chunks(abstract_text)
        if parts:
            vecs = embed_texts(parts)
            for j, (part, vec) in enumerate(zip(parts, vecs), start=1):
                ch = Chunk(project_id=proj.id, section_id=sec.id, content=part, ord_in_sec=j)
                db.add(ch); db.flush()
                db.add(Embedding(chunk_id=ch.id, vector=pack_vector(vec)))

    insert_fts_row(db, proj.id, proj.title or "", proj.abstract or "", abstract_text or "")
    return proj.id
