import requests

from app.core.config import settings


class EmbeddingError(RuntimeError):
    pass


def embed_text(text: str) -> list[float]:
    token = settings.github_models_token.strip()
    if not token:
        raise EmbeddingError("Missing GITHUB_MODELS_TOKEN configuration.")

    base_url = settings.github_models_base_url.rstrip("/")
    url = f"{base_url}/inference/embeddings"

    headers = {
        "Accept": "application/vnd.github+json",
        "Authorization": f"Bearer {token}",
        "X-GitHub-Api-Version": settings.github_api_version,
    }
    payload = {
        "model": settings.github_embed_model,
        "input": [text],
        "encoding_format": "float",
    }

    try:
        response = requests.post(url, headers=headers, json=payload, timeout=15)
    except requests.RequestException as exc:
        raise EmbeddingError(f"Failed to call GitHub Models embeddings API: {exc}") from exc

    if response.status_code >= 400:
        body = response.text.strip() or "(empty response body)"
        raise EmbeddingError(
            f"GitHub Models embeddings API returned {response.status_code}: {body}"
        )

    try:
        response_data = response.json()
        embedding = response_data["data"][0]["embedding"]
    except (ValueError, KeyError, IndexError, TypeError) as exc:
        raise EmbeddingError("GitHub Models embeddings API returned an unexpected response.") from exc

    if not isinstance(embedding, list) or not all(
        isinstance(item, (float, int)) for item in embedding
    ):
        raise EmbeddingError("Embedding response is not a valid list of float values.")

    return [float(item) for item in embedding]
