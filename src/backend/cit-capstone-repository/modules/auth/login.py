
from fastapi import FastAPI
from fastapi.params import Depends
from fastapi.responses import FileResponse, HTMLResponse, RedirectResponse

from config import PathConfig
from helpers.session import get_current_user

def register_login_route(app: FastAPI):

    @app.get("/login", response_class=HTMLResponse)
    def login(claims=Depends(get_current_user)):
        if claims:
            return RedirectResponse(url="/", status_code=303)
        return FileResponse(PathConfig.TEMPLATES_DIR / "login.html")
