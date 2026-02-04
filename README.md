# K-atalog

K-Pop photocard catalog: React frontend + FastAPI backend, with optional MongoDB.

## Structure

| Directory | Description |
|-----------|-------------|
| **client/** | Vite + React + TypeScript frontend |
| **server/** | FastAPI backend (see [server/README.md](server/README.md)) |

## Quick start

### 1. Backend

```bash
cd server
python -m venv .venv
.venv\Scripts\activate   # Windows
# source .venv/bin/activate   # macOS/Linux
pip install -r requirements.txt
cp .env.example .env      # edit as needed (SECRET_KEY, MONGODB_URI, ALLOWED_ORIGINS)
python -m uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

### 2. Frontend

```bash
cd client
npm install
npm run dev
```

Open **http://localhost:5173**. The app proxies `/api` to the backend.

## Docs

- [server/README.md](server/README.md) — API setup, endpoints, data
- [server/MONGODB_SETUP.md](server/MONGODB_SETUP.md) — MongoDB (optional)
- [SECURITY.md](SECURITY.md) — Security and production deployment
- [TROUBLESHOOTING.md](TROUBLESHOOTING.md) — Common issues (e.g. "site cannot be reached")

## License

Private / unlicensed unless you add one.
