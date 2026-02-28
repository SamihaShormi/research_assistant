from fastapi import APIRouter, HTTPException, Query

from app.services.embeddings import EmbeddingError, embed_text

router = APIRouter(tags=["debug"])


@router.get("/debug/embed")
def debug_embed(q: str = Query(..., min_length=1)) -> dict[str, int]:
    try:
        embedding = embed_text(q)
    except EmbeddingError as exc:
        raise HTTPException(status_code=500, detail=str(exc)) from exc

    return {"embedding_length": len(embedding)}
