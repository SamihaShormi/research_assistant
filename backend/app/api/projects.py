from pathlib import Path

from fastapi import APIRouter, Depends, File, HTTPException, UploadFile, status
from pydantic import BaseModel
from sqlalchemy.orm import Session

from app.db import get_db
from app.models import Chunk, Document, Project, User
from app.security import get_current_user
from app.services import chunk_text, parse_document, persist_upload, rebuild_project_index, search_project_chunks

router = APIRouter(tags=["projects"])


class ProjectCreate(BaseModel):
    name: str
    description: str | None = None


class ProjectResponse(BaseModel):
    id: int
    name: str
    description: str | None

    class Config:
        from_attributes = True


class DocumentResponse(BaseModel):
    id: int
    filename: str
    created_at: str


class SearchRequest(BaseModel):
    query: str
    top_k: int = 5


class SearchResult(BaseModel):
    document_id: int
    filename: str
    chunk_id: int
    snippet: str
    score: float


class SearchResponse(BaseModel):
    results: list[SearchResult]


def _get_owned_project(db: Session, current_user: User, project_id: int) -> Project:
    project = db.query(Project).filter(Project.id == project_id, Project.owner_id == current_user.id).first()
    if not project:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Project not found")
    return project


@router.post("", response_model=ProjectResponse, status_code=status.HTTP_201_CREATED)
def create_project(
    payload: ProjectCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> Project:
    project = Project(name=payload.name, description=payload.description, owner_id=current_user.id)
    db.add(project)
    db.commit()
    db.refresh(project)
    return project


@router.get("", response_model=list[ProjectResponse])
def list_projects(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)) -> list[Project]:
    return db.query(Project).filter(Project.owner_id == current_user.id).all()


@router.delete("/{project_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_project(
    project_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> None:
    project = _get_owned_project(db, current_user, project_id)

    db.delete(project)
    db.commit()


@router.post("/{project_id}/documents", response_model=DocumentResponse, status_code=status.HTTP_201_CREATED)
def upload_document(
    project_id: int,
    file: UploadFile = File(...),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> DocumentResponse:
    _get_owned_project(db, current_user, project_id)
    if not file.filename:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Filename is required")

    suffix = Path(file.filename).suffix.lower()
    if suffix not in {".txt", ".pdf"}:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Only TXT and PDF files are supported")

    content = file.file.read()
    stored_path = persist_upload(project_id, file.filename, content)
    try:
        text = parse_document(stored_path)
    except Exception as exc:
        stored_path.unlink(missing_ok=True)
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(exc)) from exc

    chunks = chunk_text(text)
    if not chunks:
        stored_path.unlink(missing_ok=True)
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="No extractable text found in file")

    document = Document(project_id=project_id, filename=file.filename, stored_path=str(stored_path))
    db.add(document)
    db.flush()

    chunk_rows = [
        Chunk(project_id=project_id, document_id=document.id, chunk_index=index, text=chunk)
        for index, chunk in enumerate(chunks)
    ]
    db.add_all(chunk_rows)
    db.commit()
    db.refresh(document)

    rebuild_project_index(db, project_id)

    return DocumentResponse(id=document.id, filename=document.filename, created_at=document.created_at.isoformat())


@router.get("/{project_id}/documents", response_model=list[DocumentResponse])
def list_documents(
    project_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> list[DocumentResponse]:
    _get_owned_project(db, current_user, project_id)
    documents = db.query(Document).filter(Document.project_id == project_id).order_by(Document.created_at.desc()).all()
    return [DocumentResponse(id=doc.id, filename=doc.filename, created_at=doc.created_at.isoformat()) for doc in documents]


@router.delete("/{project_id}/documents/{doc_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_document(
    project_id: int,
    doc_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> None:
    _get_owned_project(db, current_user, project_id)
    document = db.query(Document).filter(Document.id == doc_id, Document.project_id == project_id).first()
    if not document:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Document not found")

    stored_path = Path(document.stored_path)
    db.delete(document)
    db.commit()
    stored_path.unlink(missing_ok=True)

    rebuild_project_index(db, project_id)


@router.post("/{project_id}/search", response_model=SearchResponse)
def semantic_search(
    project_id: int,
    payload: SearchRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> SearchResponse:
    _get_owned_project(db, current_user, project_id)
    top_k = min(max(payload.top_k, 1), 20)
    results = search_project_chunks(db=db, project_id=project_id, query=payload.query, top_k=top_k)
    return SearchResponse(results=[SearchResult(**row) for row in results])
