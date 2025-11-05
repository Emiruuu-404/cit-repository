from typing import Optional
from fastapi import Depends, FastAPI, HTTPException
from fastapi.params import Form
from sqlalchemy.orm import Session
from db import get_db
from helpers.password import hash_password
from helpers.session import require_role
from dtos import UserResponse
from models import User


def register_api_update_user_route(app: FastAPI):

    @app.put("/api/users/{user_id}", response_model=UserResponse)
    def update_user(
        user_id: int,
        email: Optional[str] = Form(None),
        password: Optional[str] = Form(None),
        role: Optional[str] = Form(None),
        db: Session = Depends(get_db),
        claims = Depends(require_role(["Admin"]))
    ):
        db_user = db.query(User).filter(User.id == user_id).first()
        if not db_user:
            raise HTTPException(status_code=404, detail="User not found")

        if email:
            if email != db_user.email and db.query(User).filter(User.email == email).first():
                raise HTTPException(status_code=400, detail="Email already exists")
            db_user.email = email

        if password:
            db_user.password = hash_password(password)

        if role:
            db_user.role = role

        db.commit()
        db.refresh(db_user)
        return db_user
