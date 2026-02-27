import json
from pathlib import Path

import faiss
import numpy as np
import requests
from fastapi import HTTPException, UploadFile
from pypdf import PdfReader

from app.core.config import settings

CHUNK_SIZE = 1000
CHUNK_OVERLAP = 150

BASE_DIR = Path(__file__).resolve().parents[1].parent
DATA_DIR = BASE_DIR / "data"
UPLOADS_DIR = DATA_DIR / "uploads"
FAISS_DIR = DATA_DIR / "faiss"


def _project_upload_dir(project_id: int) -> Path:
    project_dir = UPLOADS_DIR / str(project_id)
    project_dir.mkdir(parents=True, exist_ok=True)
    return project_dir


def _project_index_dir(project_id: int) -> Path:
    project_dir = FAISS_DIR / str(project_id)
    project_dir.mkdir(parents=True, exist_ok=True)
    return project_dir


def _project_index_path(project_id: int) -> Path:
    return _project_index_dir(project_id) / "index.faiss"


def _project_mapping_path(project_id: int) -> Path:
    return _project_index_dir(project_id) / "mapping.json"


def persist_upload(project_id: int, upload: UploadFile) -> Path:
    if not upload.filename:
        raise HTTPException(status_code=400, detail="Uploaded file must include a filename")

    destination = _project_upload_dir(project_id) / Path(upload.filename).name
    with destination.open("wb") as f:
        f.write(upload.file.read())
    return destination


def parse_document(file_path: Path) -> str:
    suffix = file_path.suffix.lower()

    if suffix == ".txt":
        return file_path.read_text(encoding="utf-8", errors="ignore")

    if suffix == ".pdf":
        reader = PdfReader(str(file_path))
        pages = [page.extract_text() or "" for page in reader.pages]
        return "\n".join(pages)

    raise HTTPException(status_code=400, detail=f"Unsupported file format: {suffix}")


def chunk_text(text: str, chunk_size: int = CHUNK_SIZE, overlap: int = CHUNK_OVERLAP) -> list[str]:
    cleaned = (text or "").strip()
    if not cleaned:
        return []

    chunks: list[str] = []
    start = 0
    text_len = len(cleaned)

    while start < text_len:
        end = min(start + chunk_size, text_len)
        chunks.append(cleaned[start:end])
        if end == text_len:
            break
        start = max(end - overlap, start + 1)

    return chunks


def embed_texts(texts: list[str]) -> list[list[float]]:
    if not texts:
        return []

    if not settings.github_token:
        raise HTTPException(status_code=500, detail="GITHUB_TOKEN is not configured")

    url = settings.github_models_endpoint.rstrip("/") + "/embeddings"
    payload = {
        "input": texts,
        "model": settings.github_embedding_model,
    }
    headers = {
        "Authorization": f"Bearer {settings.github_token}",
        "Accept": "application/vnd.github+json",
        "X-GitHub-Api-Version": "2022-11-28",
        "Content-Type": "application/json",
    }

    response = requests.post(url, headers=headers, json=payload, timeout=60)
    if response.status_code >= 400:
        raise HTTPException(status_code=502, detail=f"Embedding request failed: {response.text}")

    body = response.json()
    data = body.get("data", [])
    sorted_rows = sorted(data, key=lambda row: row.get("index", 0))
    embeddings = [row.get("embedding") for row in sorted_rows]

    if len(embeddings) != len(texts) or any(embedding is None for embedding in embeddings):
        raise HTTPException(status_code=502, detail="Embedding response was incomplete")

    return embeddings


def rebuild_project_index(project_id: int) -> dict:
    upload_dir = _project_upload_dir(project_id)
    files = sorted([p for p in upload_dir.iterdir() if p.is_file()])

    all_chunks: list[dict] = []
    for file_path in files:
        text = parse_document(file_path)
        chunks = chunk_text(text)
        for idx, chunk in enumerate(chunks):
            all_chunks.append(
                {
                    "source": file_path.name,
                    "chunk_index": idx,
                    "text": chunk,
                }
            )

    index_path = _project_index_path(project_id)
    mapping_path = _project_mapping_path(project_id)

    if not all_chunks:
        if index_path.exists():
            index_path.unlink()
        mapping_path.write_text("[]", encoding="utf-8")
        return {"chunks": 0}

    embeddings = embed_texts([chunk["text"] for chunk in all_chunks])
    matrix = np.array(embeddings, dtype="float32")
    faiss.normalize_L2(matrix)

    index = faiss.IndexFlatIP(matrix.shape[1])
    index.add(matrix)

    faiss.write_index(index, str(index_path))
    mapping_path.write_text(json.dumps(all_chunks, ensure_ascii=False), encoding="utf-8")

    return {"chunks": len(all_chunks)}


def search_project_chunks(project_id: int, query: str, top_k: int = 5) -> list[dict]:
    index_path = _project_index_path(project_id)
    mapping_path = _project_mapping_path(project_id)

    if not index_path.exists() or not mapping_path.exists():
        return []

    mapping = json.loads(mapping_path.read_text(encoding="utf-8"))
    if not mapping:
        return []

    query_embedding = np.array(embed_texts([query]), dtype="float32")
    faiss.normalize_L2(query_embedding)

    index = faiss.read_index(str(index_path))
    scores, indices = index.search(query_embedding, top_k)

    results: list[dict] = []
    for score, idx in zip(scores[0], indices[0]):
        if idx < 0 or idx >= len(mapping):
            continue
        item = mapping[idx]
        results.append(
            {
                "score": float(score),
                "source": item["source"],
                "chunk_index": item["chunk_index"],
                "text": item["text"],
            }
        )

    return results
