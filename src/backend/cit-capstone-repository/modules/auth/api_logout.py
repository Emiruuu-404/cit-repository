
from fastapi import FastAPI, Response
from fastapi.responses import JSONResponse


def register_api_logout_route(app: FastAPI):
    @app.post("/api/logout")
    def logout(response: Response):
        response = JSONResponse(content={"message": "Logged out successfully"})
        response.delete_cookie("access_token")
        return response

