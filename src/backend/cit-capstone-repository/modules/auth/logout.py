
from fastapi import FastAPI
from fastapi.responses import RedirectResponse

def register_logout_route(app: FastAPI):
    @app.get("/logout")
    def logout():
        response = RedirectResponse(url="/", status_code=303)
        response.delete_cookie("access_token", path="/")
        return response
