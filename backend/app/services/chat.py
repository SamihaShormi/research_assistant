import requests

from app.core.config import settings


class ChatGenerationError(RuntimeError):
    pass


def generate_answer(question: str, context: list[dict]) -> str:
    token = settings.github_models_token.strip()
    if not token:
        raise ChatGenerationError("Missing GITHUB_MODELS_TOKEN configuration.")

    model = settings.github_chat_model.strip()
    if not model:
        raise ChatGenerationError("Missing GITHUB_CHAT_MODEL configuration.")

    base_url = settings.github_models_base_url.rstrip("/")
    url = f"{base_url}/inference/chat/completions"

    headers = {
        "Accept": "application/vnd.github+json",
        "Authorization": f"Bearer {token}",
        "X-GitHub-Api-Version": settings.github_api_version,
    }

    context_lines: list[str] = []
    for item in context:
        filename = str(item.get("filename", "unknown"))
        chunk_index = item.get("chunk_index", "unknown")
        text = str(item.get("text", "")).strip()
        score = item.get("score")
        score_text = "n/a" if score is None else f"{float(score):.4f}"
        context_lines.append(
            f"- source: {filename} (chunk {chunk_index}, score {score_text})\n{text}"
        )

    context_block = "\n\n".join(context_lines) if context_lines else "(no context provided)"

    payload = {
        "model": model,
        "messages": [
            {
                "role": "system",
                "content": (
                    "Answer using ONLY the provided context. "
                    "If not found, say you don't know."
                ),
            },
            {
                "role": "user",
                "content": f"Question: {question}\n\nContext:\n{context_block}",
            },
        ],
        "temperature": 0,
    }

    try:
        response = requests.post(url, headers=headers, json=payload, timeout=30)
    except requests.Timeout as exc:
        raise ChatGenerationError("GitHub Models chat/completions request timed out.") from exc
    except requests.RequestException as exc:
        raise ChatGenerationError(f"Failed to call GitHub Models chat/completions API: {exc}") from exc

    if response.status_code >= 400:
        body = response.text.strip() or "(empty response body)"
        raise ChatGenerationError(
            f"GitHub Models chat/completions API returned {response.status_code}: {body}"
        )

    try:
        response_data = response.json()
        answer = response_data["choices"][0]["message"]["content"]
    except (ValueError, KeyError, IndexError, TypeError) as exc:
        raise ChatGenerationError(
            "GitHub Models chat/completions API returned an unexpected response."
        ) from exc

    if not isinstance(answer, str) or not answer.strip():
        raise ChatGenerationError("Chat response did not contain a valid answer.")

    return answer.strip()
