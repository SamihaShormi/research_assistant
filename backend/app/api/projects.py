import json
import math
from io import BytesIO

import pdfplumber
from fastapi import APIRouter, Depends, File, HTTPException, UploadFile, status
from pydantic import BaseModel
from sqlalchemy.orm import Session

from app.db import get_db
from app.models import Chunk, Document, Project, User
from app.security import get_current_user
from app.services.chat import ChatGenerationError, generate_answer
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

class ProjectActivityItem(BaseModel):
    type: str
    filename: str
    created_at: str | None



def _create_document_chunks(
    project_id: int,
    filename: str,
    content: str,
    db: Session,
) -> TextDocumentUploadResponse:
    document = Document(
        project_id=project_id,
        filename=filename,
    )
    db.add(document)
    db.flush()  # get document.id without committing

    chunks = chunk_text(content)

    if len(chunks) > 1000:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Document too large. Please upload a smaller file.",
        )

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


def _get_project_or_404(project_id: int, user_id: int, db: Session) -> Project:
    project = db.query(Project).filter(
        Project.id == project_id,
        Project.owner_id == user_id,
    ).first()

    if not project:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Project not found",
        )

    return project


def _search_project_chunk_results(
    project: Project,
    query: str,
    k: int,
    db: Session,
    min_score: float = 0.75,
) -> list[dict]:
    k = max(1, min(k, 20))
    query_embedding = embed_text(query)

    chunk_rows = db.query(Chunk, Document).join(
        Document,
        Chunk.document_id == Document.id,
    ).filter(
        Document.project_id == project.id,
    ).all()

    if not chunk_rows:
        return []

    scored_results = []

    for chunk, document in chunk_rows:
        try:
            chunk_embedding = json.loads(chunk.embedding)
        except (TypeError, ValueError, json.JSONDecodeError):
            continue

        if not isinstance(chunk_embedding, list):
            continue

        similarity = _cosine_similarity(query_embedding, chunk_embedding)

        if similarity is None or similarity < min_score:
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
    return scored_results[:k]


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


@router.get("/{project_id}", response_model=ProjectResponse)
def get_project(
    project_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> Project:
    return _get_project_or_404(project_id=project_id, user_id=current_user.id, db=db)


@router.get("/{project_id}/activity", response_model=list[ProjectActivityItem])
def get_project_activity(
    project_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> list[ProjectActivityItem]:
    project = _get_project_or_404(project_id=project_id, user_id=current_user.id, db=db)

    documents = (
        db.query(Document)
        .filter(Document.project_id == project.id)
        .order_by(Document.created_at.desc())
        .limit(50)
        .all()
    )

    return [
        ProjectActivityItem(
            type="source_uploaded",
            filename=document.filename,
            created_at=document.created_at.isoformat() if document.created_at else None,
        )
        for document in documents
    ]


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

    project = _get_project_or_404(project_id=project_id, user_id=current_user.id, db=db)

    return _create_document_chunks(
        project_id=project.id,
        filename=payload.filename,
        content=payload.content,
        db=db,
    )


@router.post(
    "/{project_id}/documents/pdf",
    response_model=TextDocumentUploadResponse,
    status_code=status.HTTP_201_CREATED,
)
async def upload_pdf_document(
    project_id: int,
    file: UploadFile = File(...),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> TextDocumentUploadResponse:
    project = _get_project_or_404(project_id=project_id, user_id=current_user.id, db=db)

    content_type = (file.content_type or "").lower()
    filename = file.filename or "uploaded.pdf"
    if content_type != "application/pdf" and not filename.lower().endswith(".pdf"):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Uploaded file must be a PDF",
        )

    pdf_bytes = await file.read()
    if not pdf_bytes:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Uploaded file is empty",
        )

    try:
        with pdfplumber.open(BytesIO(pdf_bytes)) as pdf:
            text_content = "\n".join((page.extract_text() or "") for page in pdf)
    except Exception as exc:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Failed to extract text from PDF: {exc}",
        ) from exc

    if not text_content.strip():
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="No extractable text found in PDF",
        )

    return _create_document_chunks(
        project_id=project.id,
        filename=filename,
        content=text_content,
        db=db,
    )


@router.delete("/{project_id}/documents/{document_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_project_document(
    project_id: int,
    document_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> None:
    project = _get_project_or_404(project_id=project_id, user_id=current_user.id, db=db)

    document = (
        db.query(Document)
        .filter(
            Document.id == document_id,
            Document.project_id == project.id,
        )
        .first()
    )

    if not document:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Document not found",
        )

    db.query(Chunk).filter(Chunk.document_id == document.id).delete()
    db.delete(document)
    db.commit()


@router.delete("/{project_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_project(
    project_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> None:
    project = _get_project_or_404(project_id=project_id, user_id=current_user.id, db=db)

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
    project = _get_project_or_404(project_id=project_id, user_id=current_user.id, db=db)
    bounded_k = max(1, min(k, 20))
    results = _search_project_chunk_results(
        project=project,
        query=q,
        k=bounded_k,
        db=db,
        min_score=0.75,
    )

    return {
        "query": q,
        "k": bounded_k,
        "results": results,
    }


@router.get("/{project_id}/ask")
def ask_project(
    project_id: int,
    q: str,
    k: int = 5,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> dict:
    project = _get_project_or_404(project_id=project_id, user_id=current_user.id, db=db)
    bounded_k = max(1, min(k, 20))
    results = _search_project_chunk_results(
        project=project,
        query=q,
        k=bounded_k,
        db=db,
        min_score=0.75,
    )

    if not results:
        return {
            "query": q,
            "answer": "I couldn't find anything relevant in your documents.",
            "sources": [],
        }

    context = [
        {
            "filename": item["filename"],
            "chunk_index": item["chunk_index"],
            "score": item["score"],
            "text": item["text"],
        }
        for item in results
    ]

    try:
        answer = generate_answer(question=q, context=context)
    except ChatGenerationError as exc:
        raise HTTPException(
            status_code=status.HTTP_502_BAD_GATEWAY,
            detail=f"Failed to generate answer: {exc}",
        ) from exc

    return {
        "query": q,
        "answer": answer,
        "sources": [
            {
                "filename": item["filename"],
                "chunk_index": item["chunk_index"],
                "score": item["score"],
            }
            for item in results
        ],
    }
