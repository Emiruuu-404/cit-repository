from fastapi import Depends, FastAPI

from helpers.session import get_current_user


def register_api_current_user_route(app: FastAPI):
    @app.get("/api/users/current")
    def read_current_user(claims=Depends(get_current_user)):
        if not claims:
            return {"email": None}
        return {"email": claims["sub"], "role": claims["role"]}
