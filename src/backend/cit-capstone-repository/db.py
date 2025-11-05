from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, Session

from contextlib import contextmanager
from sqlalchemy import text

from models import Base

# ------------------------------
# Database setup
# ------------------------------
DATABASE_URL = "sqlite:///./capstone_repo.db"
engine = create_engine(DATABASE_URL, connect_args={"check_same_thread": False})
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

Base.metadata.create_all(bind=engine)

# ------------------------------
# Dependency
# ------------------------------
def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

def get_db_session() -> Session:
    db = SessionLocal()
    return db

@contextmanager
def session_scope() -> Session:
    s = SessionLocal()
    try:
        yield s
        s.commit()
    except:
        s.rollback()
        raise
    finally:
        s.close()

def insert_fts_row(db: Session, project_id: int, title: str, abstract: str, fullbody: str):
    db.execute(
        text("INSERT INTO projects_fts(rowid, title, abstract, content, project_id) VALUES (:rid,:t,:a,:c,:pid)"),
        {"rid": project_id, "t": title or "", "a": abstract or "", "c": fullbody or "", "pid": project_id}
    )

def delete_fts_row(db: Session, project_id: int):
    db.execute(text("DELETE FROM projects_fts WHERE rowid=:rid"), {"rid": project_id})
