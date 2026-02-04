# Katalog API

FastAPI backend for the K-atalog photocard app. Data from `data/data.json` or MongoDB when `MONGODB_URI` is set.

## Run

```bash
pip install -r requirements.txt
cp .env.example .env   # edit as needed
python -m uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

## API

| Method | Path |
|--------|------|
| GET | `/api/v1/health`, `/api/v1/ready` |
| GET | `/api/v1/groups`, `/api/v1/groups/{id}` |
| GET | `/api/v1/groups/{id}/members`, `.../members/{mid}` |
| GET | `/api/v1/photocards`, `/api/v1/photocards/by-group/{id}` |
| GET | `/api/v1/search?q=...`, `/api/v1/search/all` |
