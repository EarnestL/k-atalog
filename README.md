# K-atalog

K-Pop photocard catalog: React frontend (Vite) + FastAPI backend, with optional MongoDB.

| Directory | Description |
|-----------|-------------|
| **client/** | Vite + React + TypeScript frontend |
| **server/** | FastAPI backend |

## Run locally

**Backend:** `cd server && pip install -r requirements.txt && python -m uvicorn app.main:app --reload --port 8000`

**Frontend:** `cd client && npm install && npm run dev` → http://localhost:5173

Set `server/.env` from `server/.env.example` (e.g. `MONGODB_URI`, `ALLOWED_ORIGINS`, `SECRET_KEY`). Set `client/.env` from `client/.env.example` for `VITE_API_BASE_URL` if calling the API directly.
