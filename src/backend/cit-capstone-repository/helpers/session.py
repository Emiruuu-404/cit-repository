from http.client import HTTPException
from typing import List, Optional
from fastapi import Depends, Request
from fastapi.responses import RedirectResponse
from datetime import datetime, timedelta

from config import AuthConfig
from jose import JWTError, jwt

from helpers.password import verify_password
from repositories.user import UserRepository
from sqlalchemy.orm import Session

def get_current_user(request: Request):
    token = request.cookies.get("access_token")
    if not token:
        return None
    try:
        payload = jwt.decode(token, AuthConfig.SECRET_KEY, algorithms=[AuthConfig.ALGORITHM])
        return payload
    except JWTError:
        return None


def authenticate_user(db: Session, email: str, password: str):
    user = UserRepository.get_user_by_email(db, email)
    if not user:
        return None
    if not verify_password(password, user.password):
        return None
    return user


def require_user(request: Request):
    user = get_current_user(request)
    if not user:
        raise HTTPException(
            status_code=303,
            detail="Redirecting to login",
            headers={"Location": "/login"}
        )



def create_access_token(data: dict, expires_delta: Optional[timedelta] = None):
    to_encode = data.copy()
    expire = datetime.utcnow() + (expires_delta or datetime.timedelta(minutes=15))
    to_encode.update({"exp": expire})
    return jwt.encode(to_encode, AuthConfig.SECRET_KEY, algorithm=AuthConfig.ALGORITHM)


def require_role(required_roles: List[str]):
    def role_checker(claims=Depends(get_current_user)):
        if not claims:
            raise HTTPException(status_code=401, detail="Not authenticated")
        if claims.get("role") not in required_roles:
            raise HTTPException(status_code=403, detail="Not enough permissions")
        return claims
    return role_checker

def require_role_frontend(required_roles: List[str]):
    def role_checker(claims=Depends(get_current_user)):
        if not claims or claims.get("role") not in required_roles:
            return RedirectResponse(url="/login", status_code=303)
        return claims
    return role_checker
