import json

from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel
from sqlalchemy.orm import Session

from app.db import get_db
from app.models import Chunk, Document, Project, User
from app.security import get_current_user
from app.services.chunking import chunk_text
from app.services.embeddings import embed_text

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


class TextDocumentUpload(BaseModel):
    filename: str
    content: str


class TextDocumentUploadResponse(BaseModel):
    document_id: int
    chunks_created: int


@router.post("", response_model=ProjectResponse, status_code=status.HTTP_201_CREATED)
def create_project(
    payload: ProjectCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> Project:
    project = Project(
        name=payload.name,
        description=payload.description,
        owner_id=current_user.id,
    )
    db.add(project)
    db.commit()
    db.refresh(project)
    return project


@router.get("", response_model=list[ProjectResponse])
def list_projects(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> list[Project]:
    return db.query(Project).filter(
        Project.owner_id == current_user.id
    ).all()


@router.post(
    "/{project_id}/documents/text",
    response_model=TextDocumentUploadResponse,
    status_code=status.HTTP_201_CREATED,
)
def upload_text_document(
    project_id: int,
    payload: TextDocumentUpload,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> TextDocumentUploadResponse:

    project = db.query(Project).filter(
        Project.id == project_id,
        Project.owner_id == current_user.id,
    ).first()

    if not project:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Project not found",
        )

    # Create document row
    document = Document(
        project_id=project.id,
        filename=payload.filename,
    )
    db.add(document)
    db.flush()  # get document.id without committing

    chunks = chunk_text(payload.content)

    for index, chunk in enumerate(chunks):
        embedding = embed_text(chunk)

        db.add(
            Chunk(
                document_id=document.id,
                chunk_index=index,
                text=chunk,
                embedding=json.dumps(embedding),
            )
        )

    db.commit()

    return TextDocumentUploadResponse(
        document_id=document.id,
        chunks_created=len(chunks),
    )


@router.delete("/{project_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_project(
    project_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> None:
    project = db.query(Project).filter(
        Project.id == project_id,
        Project.owner_id == current_user.id,
    ).first()

    if not project:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Project not found",
        )

    db.delete(project)
    db.commit()