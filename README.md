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
