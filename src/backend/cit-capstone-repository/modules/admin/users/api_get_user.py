from http.client import HTTPException
from fastapi import Depends, FastAPI
from db import get_db
from helpers.session import require_role
from dtos import UserResponse

from models import User
from sqlalchemy.orm import Session

def register_api_get_user_route(app: FastAPI):
    
    @app.get("/api/users/{user_id}", response_model=UserResponse)
    def get_user(user_id: int, db: Session = Depends(get_db), claims = Depends(require_role(["Admin"]))):
        db_user = db.query(User).filter(User.id == user_id).first()
        if not db_user:
            raise HTTPException(status_code=404, detail="User not found")
        return db_user
