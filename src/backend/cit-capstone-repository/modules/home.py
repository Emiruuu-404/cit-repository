from fastapi import FastAPI
from fastapi.responses import FileResponse, HTMLResponse

from config import PathConfig

def configure_home_module(app: FastAPI):

    @app.get("/", response_class=HTMLResponse)
    def home():
        return FileResponse(PathConfig.TEMPLATES_DIR / "index.html")
