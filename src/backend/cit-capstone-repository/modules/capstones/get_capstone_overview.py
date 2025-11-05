

from fastapi import FastAPI
from fastapi.responses import FileResponse, HTMLResponse

from config import PathConfig

def register_capstone_overview_route(app: FastAPI):
    @app.get("/capstone", response_class=HTMLResponse)
    def capstone_overview():
        return FileResponse(PathConfig.TEMPLATES_DIR / "capstone-overview.html")