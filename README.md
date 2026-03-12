# K-atalog

K-atalog is a **K-pop photocard database platform** for browsing, searching, and organizing photocards by group and member. Logged-in users can submit new photocards (with images) and track submission history.

| Directory | Description |
|-----------|-------------|
| **client/** | Vite + React + TypeScript frontend |
| **server/** | FastAPI backend |

## Key features

- **Browse & search**: Explore groups, members, and photocards with search, filtering, sorting, and pagination.
- **Photocard details**: View photocard images in a modal experience.
- **User submissions**: Authenticated users can upload photocard images and submit new entries.
- **Submission tracking**: View your submission history and status.

## Run locally (Windows / PowerShell)

### Backend

```powershell
cd "server"
pip install -r requirements.txt
Copy-Item .env.example .env
python -m uvicorn app.main:app --reload --port 8000
```

### Frontend

```powershell
cd "client"
npm install
Copy-Item .env.example .env
npm run dev
```

Frontend: `http://localhost:5173`
Backend: `http://127.0.0.1:8000` (API under `/api/v1`)

## Configuration

- **Server**: copy `server/.env.example` → `server/.env` and set values as needed (MongoDB, CORS, secrets, Supabase JWKS).
- **Client**: copy `client/.env.example` → `client/.env` and set Supabase keys and (optionally) API base URL / proxy target.

See:
- `client/README.md`
- `server/README.md`
