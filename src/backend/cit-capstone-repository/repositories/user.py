

from db import get_db_session
from models import User

class UserRepository:
    
    def get_user_by_email(self, email: str):
        db = get_db_session()
        return db.query(User).filter(User.email == email).first()