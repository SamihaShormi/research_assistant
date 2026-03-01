import json
import math

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


def _cosine_similarity(vector_a: list[float], vector_b: list[float]) -> float | None:
    if len(vector_a) != len(vector_b):
        return None

    dot_product = 0.0
    norm_a = 0.0
    norm_b = 0.0

    for value_a, value_b in zip(vector_a, vector_b):
        dot_product += value_a * value_b
        norm_a += value_a * value_a
        norm_b += value_b * value_b

    if norm_a == 0.0 or norm_b == 0.0:
        return None

    return dot_product / (math.sqrt(norm_a) * math.sqrt(norm_b))


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


@router.get("/{project_id}/search")
def search_project_chunks(
    project_id: int,
    q: str,
    k: int = 5,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> dict:
    project = db.query(Project).filter(
        Project.id == project_id,
        Project.owner_id == current_user.id,
    ).first()

    if not project:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Project not found",
        )

    k = max(1, min(k, 20))
    query_embedding = embed_text(q)

    chunk_rows = db.query(Chunk, Document).join(
        Document,
        Chunk.document_id == Document.id,
    ).filter(
        Document.project_id == project.id,
    ).all()

    if not chunk_rows:
        return {
            "query": q,
            "k": k,
            "results": [],
        }

    scored_results = []

    for chunk, document in chunk_rows:
        try:
            chunk_embedding = json.loads(chunk.embedding)
        except (TypeError, ValueError, json.JSONDecodeError):
            continue

        if not isinstance(chunk_embedding, list):
            continue

        similarity = _cosine_similarity(query_embedding, chunk_embedding)

        if similarity is None:
            continue

        scored_results.append(
            {
                "score": similarity,
                "document_id": document.id,
                "filename": document.filename,
                "chunk_index": chunk.chunk_index,
                "text": chunk.text,
            }
        )

    scored_results.sort(key=lambda item: item["score"], reverse=True)

    return {
        "query": q,
        "k": k,
        "results": scored_results[:k],
    }
