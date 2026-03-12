# Katalog API

FastAPI backend for **K-atalog**, a K-pop photocard database platform.

This service exposes REST endpoints for groups, members, photocards, search, and user submissions. It can run in two modes:

- **MongoDB mode** (recommended for full functionality): set `MONGODB_URI` and data is stored/queried from MongoDB.
- **File fallback mode** (read-only catalog): if `MONGODB_URI` is not set, the API loads seed data from `server/data/data.json` (or the client seed data) into memory.

Authentication uses **Supabase JWT** verification (JWKS/ES256 supported) for protected routes.

## Run

```bash
cd server
pip install -r requirements.txt
cp .env.example .env   # edit as needed
python -m uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

API base: `http://127.0.0.1:8000/api/v1`

## Tech stack

- **FastAPI** (Python) for the REST API
- **Pydantic v2** for request/response schemas and validation
- **Motor** (async MongoDB driver) for database access (when configured)
- **Supabase Auth**: JWT verification via JWKS (`SUPABASE_URL`) or legacy secret (`SUPABASE_JWT_SECRET`)

## High-level architecture

- **Routes** live in `app/api/v1/endpoints/`
- **Schemas** live in `app/schemas/` and define the response shapes consumed by the client
- **Data access** lives in `app/services/data_loader.py`
  - Loads groups/photocards from file when MongoDB is not configured
  - Connects/seeds MongoDB on startup when configured
- **Security**
  - CORS configured by `ALLOWED_ORIGINS`
  - Basic security headers + CSP in `app/main.py`
  - Simple in-memory rate limiting in `app/main.py`

## API

| Method | Path |
|--------|------|
| GET | `/api/v1/health` |
| GET | `/api/v1/groups`, `/api/v1/groups/{id}` |
| GET | `/api/v1/groups/{id}/members`, `/api/v1/groups/{id}/members/{memberId}` |
| GET | `/api/v1/photocards`, `/api/v1/photocards/by-group/{id}` |
| POST | `/api/v1/photocards` *(requires auth + MongoDB)* |
| GET | `/api/v1/search?q=...`, `/api/v1/search/all` |
| GET | `/api/v1/submissions` *(requires auth)* |
