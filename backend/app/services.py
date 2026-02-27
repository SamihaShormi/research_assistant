import json
from pathlib import Path
from uuid import uuid4

import faiss
from openai import AzureOpenAI
from pypdf import PdfReader
from sqlalchemy.orm import Session

from app.core.config import settings
from app.models import Chunk, Document

UPLOAD_ROOT = Path(__file__).resolve().parents[1] / "data" / "uploads"
FAISS_ROOT = Path(__file__).resolve().parents[1] / "data" / "faiss"


def chunk_text(text: str, chunk_size: int = 1000, overlap: int = 150) -> list[str]:
    cleaned = text.strip()
    if not cleaned:
        return []

    chunks: list[str] = []
    start = 0
    while start < len(cleaned):
        end = min(start + chunk_size, len(cleaned))
        chunk = cleaned[start:end].strip()
        if chunk:
            chunks.append(chunk)
        if end == len(cleaned):
            break
        start = max(0, end - overlap)
    return chunks


def parse_document(file_path: Path) -> str:
    suffix = file_path.suffix.lower()
    if suffix == ".txt":
        return file_path.read_text(encoding="utf-8", errors="ignore")
    if suffix == ".pdf":
        reader = PdfReader(str(file_path))
        pages = [page.extract_text() or "" for page in reader.pages]
        return "\n".join(pages)
    raise ValueError("Unsupported file type. Only .txt and .pdf are supported.")


def get_embedding_client() -> AzureOpenAI:
    return AzureOpenAI(
        api_key=settings.azure_openai_api_key,
        api_version=settings.azure_openai_api_version,
        azure_endpoint=settings.azure_openai_endpoint,
    )


def embed_texts(texts: list[str]) -> list[list[float]]:
    if not texts:
        return []
    if not all(
        [
            settings.azure_openai_endpoint,
            settings.azure_openai_api_key,
            settings.azure_openai_api_version,
            settings.azure_openai_embedding_deployment,
        ]
    ):
        raise ValueError("Azure OpenAI embedding settings are not configured")

    client = get_embedding_client()
    response = client.embeddings.create(model=settings.azure_openai_embedding_deployment, input=texts)
    return [item.embedding for item in response.data]


def _project_dirs(project_id: int) -> tuple[Path, Path, Path]:
    project_upload_dir = UPLOAD_ROOT / str(project_id)
    project_index_dir = FAISS_ROOT / str(project_id)
    index_path = project_index_dir / "index.faiss"
    mapping_path = project_index_dir / "mapping.json"
    return project_upload_dir, index_path, mapping_path


def persist_upload(project_id: int, filename: str, data: bytes) -> Path:
    project_upload_dir, _, _ = _project_dirs(project_id)
    project_upload_dir.mkdir(parents=True, exist_ok=True)
    stored_filename = f"{uuid4().hex}_{filename}"
    destination = project_upload_dir / stored_filename
    destination.write_bytes(data)
    return destination


def rebuild_project_index(db: Session, project_id: int) -> None:
    _, index_path, mapping_path = _project_dirs(project_id)
    index_path.parent.mkdir(parents=True, exist_ok=True)

    chunks = db.query(Chunk).filter(Chunk.project_id == project_id).order_by(Chunk.id.asc()).all()
    if not chunks:
        if index_path.exists():
            index_path.unlink()
        if mapping_path.exists():
            mapping_path.unlink()
        return

    vectors = embed_texts([chunk.text for chunk in chunks])
    dimension = len(vectors[0])
    index = faiss.IndexFlatIP(dimension)

    import numpy as np

    vector_array = np.array(vectors, dtype="float32")
    faiss.normalize_L2(vector_array)
    index.add(vector_array)

    faiss.write_index(index, str(index_path))
    mapping = {"chunk_ids": [chunk.id for chunk in chunks]}
    mapping_path.write_text(json.dumps(mapping), encoding="utf-8")


def search_project_chunks(db: Session, project_id: int, query: str, top_k: int = 5) -> list[dict]:
    _, index_path, mapping_path = _project_dirs(project_id)
    if not index_path.exists() or not mapping_path.exists():
        return []

    vectors = embed_texts([query])
    if not vectors:
        return []

    import numpy as np

    query_vec = np.array(vectors, dtype="float32")
    faiss.normalize_L2(query_vec)

    index = faiss.read_index(str(index_path))
    scores, positions = index.search(query_vec, top_k)

    mapping = json.loads(mapping_path.read_text(encoding="utf-8"))
    chunk_ids = mapping.get("chunk_ids", [])

    results: list[dict] = []
    for score, position in zip(scores[0], positions[0]):
        if position < 0 or position >= len(chunk_ids):
            continue
        chunk_id = chunk_ids[position]
        chunk = (
            db.query(Chunk, Document)
            .join(Document, Document.id == Chunk.document_id)
            .filter(Chunk.id == chunk_id, Chunk.project_id == project_id)
            .first()
        )
        if not chunk:
            continue
        chunk_row, document_row = chunk
        snippet = chunk_row.text[:300]
        results.append(
            {
                "document_id": document_row.id,
                "filename": document_row.filename,
                "chunk_id": chunk_row.id,
                "snippet": snippet,
                "score": float(score),
            }
        )

    return results
