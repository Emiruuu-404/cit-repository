from fastapi import Depends, FastAPI
from fastapi.responses import FileResponse, HTMLResponse, RedirectResponse

from config import PathConfig
from helpers.session import require_role_frontend


def register_manage_users_route(app: FastAPI):    
    @app.get("/manage-users", response_class=HTMLResponse)
    def manage_users(claims=Depends(require_role_frontend(["Admin"]))):
        if isinstance(claims, RedirectResponse):
            return claims
        response = FileResponse(PathConfig.TEMPLATES_DIR / "manage-users.html")
        response.headers["Cache-Control"] = "no-store"
        return response
