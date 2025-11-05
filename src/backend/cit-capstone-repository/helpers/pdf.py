
from pathlib import Path
import re
import uuid

from fastapi import UploadFile
from config import PathConfig

class PdfHelper:

    @staticmethod
    def generate_pdf_filename(title: str, original_filename: str) -> str:
        ext = Path(original_filename).suffix or ".pdf"
        safe_title = re.sub(r'[^a-zA-Z0-9_-]', "_", title.strip().lower())
        safe_title = safe_title[:50].rstrip("_")
        if not safe_title:
            safe_title = "capstone"
        rand_str = uuid.uuid4().hex[:8]
        return f"{safe_title}_{rand_str}{ext}"

    @staticmethod
    def save_pdf(file: UploadFile, title: str) -> str:
        PathConfig.UPLOAD_DIR.mkdir(parents=True, exist_ok=True)
        filename = PdfHelper.generate_pdf_filename(title, file.filename)
        path = PathConfig.UPLOAD_DIR / filename
        with open(path, "wb") as f:
            f.write(file.file.read())
        return filename

    @staticmethod
    def delete_pdf(filename: str):
        if filename:
            path = PathConfig.UPLOAD_DIR / filename
            if path.exists():
                path.unlink()
