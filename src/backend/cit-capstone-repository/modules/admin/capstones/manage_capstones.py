from fastapi import Depends, FastAPI
from fastapi.responses import FileResponse, HTMLResponse, RedirectResponse

from config import PathConfig
from helpers.session import require_role_frontend

def register_manage_capstones_route(app: FastAPI):
    @app.get("/manage-capstones", response_class=HTMLResponse)
    def manage_capstones(claims=Depends(require_role_frontend(["Admin", "Staff"]))):
        if isinstance(claims, RedirectResponse):
            return claims
        response = FileResponse(PathConfig.TEMPLATES_DIR / "manage-capstones.html")
        response.headers["Cache-Control"] = "no-store"
        return response
