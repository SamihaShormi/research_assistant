# Research Assistant Monorepo

This repository contains a FastAPI backend and a React + Vite frontend for the Research Assistant web app.

## Project structure

- `backend/` — FastAPI API server
- `frontend/` — React app with Vite + Tailwind CSS

## Backend setup and run

```bash
cd backend
python -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
cp .env.example .env
uvicorn app.main:app --reload
```

Backend will run on `http://127.0.0.1:8000`.

Health endpoint:

```bash
curl http://127.0.0.1:8000/health
```

Expected response:

```json
{"ok": true}
```

### Document ingestion + semantic search (protected)

Set Azure embedding env vars in `backend/.env`:

```bash
AZURE_OPENAI_ENDPOINT=https://<resource>.openai.azure.com
AZURE_OPENAI_API_KEY=<key>
AZURE_OPENAI_API_VERSION=2024-02-01
AZURE_OPENAI_EMBEDDING_DEPLOYMENT=text-embedding-3-small
```

Example API usage:

```bash
# 1) Login and capture token
TOKEN=$(curl -s -X POST http://127.0.0.1:8000/auth/login \
  -H 'Content-Type: application/x-www-form-urlencoded' \
  -d 'username=user@example.com&password=secret' | jq -r .access_token)

# 2) Upload a TXT/PDF document
curl -X POST "http://127.0.0.1:8000/projects/1/documents" \
  -H "Authorization: Bearer $TOKEN" \
  -F "file=@/path/to/file.pdf"

# 3) List project documents
curl -X GET "http://127.0.0.1:8000/projects/1/documents" \
  -H "Authorization: Bearer $TOKEN"

# 4) Semantic search
curl -X POST "http://127.0.0.1:8000/projects/1/search" \
  -H "Authorization: Bearer $TOKEN" \
  -H 'Content-Type: application/json' \
  -d '{"query":"summarize related work", "top_k":5}'

# 5) Delete a document
curl -X DELETE "http://127.0.0.1:8000/projects/1/documents/10" \
  -H "Authorization: Bearer $TOKEN"
```

## Frontend setup and run

```bash
cd frontend
npm install
cp .env.example .env
npm run dev
```

Frontend will run on `http://localhost:5173`.

## Notes

- Dark mode is controlled using the `dark` class on `<html>`.
- Theme is persisted in `localStorage` and defaults to system preference when unset.
- Protected routes (`/dashboard`, `/projects/:projectId`) redirect to `/login` when no token exists in `localStorage`.
- For demo UI flow, login/signup forms set a dummy `token` in `localStorage`.
