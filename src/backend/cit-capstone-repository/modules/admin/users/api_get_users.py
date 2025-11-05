from typing import Optional
from fastapi import Depends, FastAPI, Query

from db import get_db
from helpers.session import require_role
from sqlalchemy.orm import Session

from models import User

def register_api_get_users_route(app: FastAPI):
    @app.get("/api/users")
    def list_users(
        db: Session = Depends(get_db),
        page: int = Query(default=1, ge=1),
        per_page: int = Query(default=10, ge=1, le=50),
        search: Optional[str] = Query(default=None),
        claims = Depends(require_role(["Admin"]))
    ):
        query = db.query(User)
        if search:
            keyword = f"%{search}%"
            query = query.filter(User.email.ilike(keyword) | User.role.ilike(keyword))
        total = query.count()
        users = query.offset((page - 1) * per_page).limit(per_page).all()
        results = [{"id": u.id, "email": u.email, "role": u.role} for u in users]
        return {"total": total, "page": page, "per_page": per_page, "results": results}

