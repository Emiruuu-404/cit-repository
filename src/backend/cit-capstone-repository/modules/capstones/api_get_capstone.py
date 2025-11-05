from fastapi import Depends, FastAPI, HTTPException
from fastapi.responses import FileResponse
from sqlalchemy import text
from sqlalchemy.orm import Session

from config import PathConfig
from db import get_db
from helpers.pdf_builder import build_capstone_pdf, build_download_filename


def _fetch_capstone(project_id: int, db: Session):
    row = db.execute(
        text(
            """
            SELECT id, title, year, abstract, filename, sha256, course, host, doc_type, external_links
            FROM projects WHERE id=:pid
            """
        ),
        {"pid": project_id},
    ).fetchone()

    if not row:
        return None

    (
        pid,
        title,
        year,
        abstract,
        filename,
        sha,
        course,
        host,
        doc_type,
        external_links,
    ) = row

    authors = [
        r[0]
        for r in db.execute(text("SELECT full_name FROM authors WHERE project_id=:pid"), {"pid": pid}).fetchall()
    ]
    section_rows = db.execute(
        text("SELECT heading, content, order_no FROM sections WHERE project_id=:pid ORDER BY order_no"),
        {"pid": pid},
    ).fetchall()
    keywords = [
        r[0]
        for r in db.execute(text("SELECT keyword FROM project_keywords WHERE project_id=:pid"), {"pid": pid}).fetchall()
    ]

    sections = [
        {"heading": heading, "content": content, "order": order_no}
        for heading, content, order_no in section_rows
    ]

    return {
        "id": pid,
        "title": title,
        "year": year,
        "abstract": abstract,
        "filename": filename,
        "sha": sha,
        "course": course,
        "host": host,
        "doc_type": doc_type,
        "external_links": external_links,
        "authors": authors,
        "sections": sections,
        "keywords": keywords,
    }


def register_api_get_capstone_route(app: FastAPI):
    @app.get("/api/capstones/{project_id}")
    def get_project(project_id: int, db: Session = Depends(get_db)):
        project = _fetch_capstone(project_id, db)
        if not project:
            raise HTTPException(status_code=404, detail="Not found")

        download_url = f"/api/capstones/{project['id']}/download"
        download_filename = build_download_filename(project.get("title"), project["id"])
        return {
            "id": project["id"],
            "title": project.get("title"),
            "year": project.get("year"),
            "abstract": project.get("abstract"),
            "external_links": project.get("external_links"),
            "authors": project.get("authors", []),
            "sections": project.get("sections", []),
            "course": project.get("course"),
            "host": project.get("host"),
            "doc_type": project.get("doc_type"),
            "keywords": project.get("keywords", []),
            "download_url": download_url,
            "download_filename": download_filename,
            "docx": download_url,  # backward compatibility with existing frontend usage
            "filename": download_filename,
            "original_filename": project.get("filename"),
        }

    @app.get("/api/capstones/{project_id}/download")
    def download_project(project_id: int, db: Session = Depends(get_db)):
        project = _fetch_capstone(project_id, db)
        if not project:
            raise HTTPException(status_code=404, detail="Not found")

        PathConfig.UPLOAD_DIR.mkdir(parents=True, exist_ok=True)
        pdf_path = PathConfig.UPLOAD_DIR / f"{project['sha']}.pdf"

        regen_needed = not pdf_path.exists()
        if not regen_needed:
            try:
                if pdf_path.stat().st_size < 1024:
                    regen_needed = True
            except OSError:
                regen_needed = True

        if regen_needed:
            sections = project.get("sections", [])
            pdf_bytes = build_capstone_pdf(
                title=project.get("title"),
                year=project.get("year"),
                course=project.get("course"),
                host=project.get("host"),
                doc_type=project.get("doc_type"),
                authors=project.get("authors", []),
                keywords=project.get("keywords", []),
                abstract=project.get("abstract"),
                sections=[(s.get("heading"), s.get("content")) for s in sections],
            )
            pdf_path.write_bytes(pdf_bytes)

        download_filename = build_download_filename(project.get("title"), project["id"])
        return FileResponse(path=pdf_path, media_type="application/pdf", filename=download_filename)
