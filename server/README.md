# Katalog API

Production-ready FastAPI backend for the Katalog photocard catalog application.

## Features

- **Structured project**: `app/core`, `app/api`, `app/schemas`, `app/services`
- **Config**: Environment-based settings via `pydantic-settings` (`.env` supported)
- **API versioning**: Routes under `/api/v1`
- **CORS**: Configurable allowed origins for the React client
- **Health**: `/api/v1/health` (liveness), `/api/v1/ready` (readiness)
- **OpenAPI**: Swagger UI at `/docs`, ReDoc at `/redoc`

## Setup

### 1. Create virtual environment and install

```bash
cd server
python -m venv .venv
.venv\Scripts\activate   # Windows
# source .venv/bin/activate   # macOS/Linux
pip install -r requirements.txt
```

### 2. Environment (optional)

```bash
cp .env.example .env
# Edit .env (ALLOWED_ORIGINS, SECRET_KEY for production)
```

### 3. Data

Catalog data is loaded from `server/data/data.json` by default. A sample is included. To use the full client dataset, copy or symlink:

```bash
# Option A: copy
copy ..\client\src\data\data.json data\data.json

# Option B: symlink (Windows admin or Developer Mode)
mklink data\data.json ..\client\src\data\data.json
```

## Run

From the **server** directory:

```bash
# So the site is reachable (required in WSL or from another device)
python3 -m uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

Or use the script: `./run.sh` (WSL/Linux) or `.\run.ps1` (PowerShell).

**If "The site cannot be reached":** run with **`--host 0.0.0.0`** so the server listens on all interfaces (not only 127.0.0.1). Then open:

- **API root:** http://localhost:8000  
- **Swagger UI:** http://localhost:8000/docs  
- **ReDoc:** http://localhost:8000/redoc  

**Using the React app:** start the **client** with `npm run dev` in `client/` and open **http://localhost:5173** in your browser. The client proxies `/api` to the backend.  

## API Overview

| Method | Path | Description |
|--------|------|-------------|
| GET | `/api/v1/health` | Liveness |
| GET | `/api/v1/ready` | Readiness |
| GET | `/api/v1/groups` | List all groups |
| GET | `/api/v1/groups/{group_id}` | Get one group |
| GET | `/api/v1/groups/{group_id}/members` | List members |
| GET | `/api/v1/groups/{group_id}/members/{member_id}` | Get one member |
| GET | `/api/v1/groups/{group_id}/members/{member_id}/photocards` | Member photocards |
| GET | `/api/v1/photocards` | List all photocards |
| GET | `/api/v1/photocards/by-group/{group_id}` | Photocards by group |
| GET | `/api/v1/search?q=...` | Search groups, members, photocards |
| GET | `/api/v1/search/all` | All data (groups, members, photocards) |

Responses use **snake_case** (e.g. `group_id`, `image_url`). The frontend can map to camelCase if needed.

## Project layout

```
server/
├── app/
│   ├── api/
│   │   ├── deps.py           # Shared dependencies (get_group_or_404, etc.)
│   │   └── v1/
│   │       ├── router.py      # Mounts all v1 endpoints
│   │       └── endpoints/     # health, groups, members, photocards, search
│   ├── core/
│   │   ├── config.py         # Settings from env
│   │   └── logging_config.py
│   ├── schemas/              # Pydantic request/response models
│   ├── services/             # Data loading and business logic
│   └── main.py              # FastAPI app factory and lifespan
├── data/
│   └── data.json            # Catalog data (groups + photocards)
├── main.py                  # Entry point (uvicorn main:app)
├── requirements.txt
├── .env.example
└── README.md
```

## Production notes

- Set `DEBUG=false` and a strong `SECRET_KEY` in production.
- Configure `ALLOWED_ORIGINS` for your frontend origin(s).
- Run with a process manager (e.g. systemd, Docker) and multiple workers:  
  `uvicorn main:app --host 0.0.0.0 --port 8000 --workers 4`
- Replace in-memory data in `app/services/data_loader.py` with a database (e.g. SQLAlchemy + PostgreSQL) when ready.
