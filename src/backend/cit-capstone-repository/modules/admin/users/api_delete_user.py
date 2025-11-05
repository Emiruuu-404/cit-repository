from http.client import HTTPException
from fastapi import FastAPI
from fastapi.params import Depends

from db import get_db
from helpers.session import require_role
from models import User
from sqlalchemy.orm import Session


def register_api_delete_user_route(app: FastAPI):
    
    @app.delete("/api/users/{user_id}")
    def delete_user(user_id: int, db: Session = Depends(get_db), claims = Depends(require_role(["Admin"]))):
        db_user = db.query(User).filter(User.id == user_id).first()
        if not db_user:
            raise HTTPException(status_code=404, detail="User not found")
        db.delete(db_user)
        db.commit()
        return {"message": f"User {db_user.email} deleted successfully"}
