from typing import List, Optional
from pydantic import BaseModel

# ------------------------------
# Pydantic schemas
# ------------------------------
class CapstoneCreate(BaseModel):
    title: str
    abstract: Optional[str] = None
    authors: str
    year: int
    external_link: Optional[str] = None

class CapstoneResponse(BaseModel):
    id: int
    title: str
    abstract: Optional[str]
    authors: List[str]
    keywords: List[str]
    year: int

class UserCreate(BaseModel):
    email: str
    password: str
    role: str = "Staff"

class UserUpdate(BaseModel):
    email: Optional[str]
    password: Optional[str]
    role: Optional[str]

class UserResponse(BaseModel):
    id: int
    email: str
    role: str
    
    class Config:
        from_attributes = True


class SearchQuery(BaseModel):
    text: str

class ProjectOut(BaseModel):
    id: int
    title: Optional[str]
    year: Optional[int]
    abstract: Optional[str]
    authors: List[str]
    course: Optional[str] = None
    host: Optional[str] = None
    doc_type: Optional[str] = None
    external_links: Optional[str] = None
    keywords: List[str] = []
    
class PaginatedProjectOutput(BaseModel):
    total: int
    page: int
    per_page: int
    results: List[ProjectOut] = []
    
class SummarizeIn(BaseModel):
    query: str
    k: int = 12