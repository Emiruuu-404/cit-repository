from http.client import HTTPException
from fastapi import Depends, FastAPI, Form

from db import get_db
from helpers.password import hash_password
from helpers.session import require_role
from dtos import UserResponse
from sqlalchemy.orm import Session

from models import User

def register_create_user_route(app: FastAPI):
    @app.post("/api/users", response_model=UserResponse)
    def create_user(
        email: str = Form(...),
        password: str = Form(...),
        role: str = Form("Staff"),
        db: Session = Depends(get_db),
        claims = Depends(require_role(["Admin"]))
    ):
        if db.query(User).filter(User.email == email).first():
            raise HTTPException(status_code=400, detail="Email already exists")

        hashed_pw = hash_password(password)
        db_user = User(email=email, password=hashed_pw, role=role)
        db.add(db_user)
        db.commit()
        db.refresh(db_user)
        return db_user

