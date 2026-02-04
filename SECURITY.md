# Security and production deployment

This document summarizes security measures and a deployment checklist for Katalog.

## Security measures in place

### Backend (FastAPI)

- **Secrets**: No secrets in code. `MONGODB_URI` and `SECRET_KEY` are read from environment / `.env` only. `.env` is in `.gitignore`.
- **Production secret**: With `ENVIRONMENT=production`, the app will not start unless `SECRET_KEY` is set to something other than the default placeholder. Generate a value with: `openssl rand -hex 32`.
- **CORS**: Configurable via `ALLOWED_ORIGINS`. In production, set this to your frontend origin(s) only (e.g. `https://katalog.example.com`). Do not use `*` when credentials are enabled.
- **HTTP methods**: CORS allows only `GET` (read-only API), reducing abuse surface.
- **Security headers**: All responses get:
  - `X-Content-Type-Options: nosniff`
  - `X-Frame-Options: DENY`
  - `X-XSS-Protection: 1; mode=block`
  - `Referrer-Policy: strict-origin-when-cross-origin`
- **API docs**: When `ENVIRONMENT=production` and `DEBUG=false`, `/docs`, `/redoc`, and `/openapi.json` are disabled to reduce information disclosure.
- **Error details**: Exception messages in HTTP responses are only shown when `DEBUG=true`. In production, set `DEBUG=false`.
- **Input limits**: Search query length is capped at 500 characters. Path parameters (`group_id`, `member_id`) are limited to 200 characters to avoid abuse.
- **MongoDB**: Queries use parameterized filters (e.g. `find_one({"id": group_id})`). User input is not concatenated into raw queries. Search is performed in-memory over already-fetched data, not via a raw MongoDB `$regex` with user input.
- **Logging**: MongoDB URI is never logged. Access log level can be set to WARNING in production to reduce log volume.

### Frontend (Vite/React)

- **No XSS patterns**: No `dangerouslySetInnerHTML`, `eval`, or `innerHTML` usage in the app.
- **API URL**: Only `VITE_*` env vars are embedded in the build. Set `VITE_API_BASE_URL` in your build environment to your production API URL. Do not put secrets in client env (they would be visible in the bundle).
- **.env**: Client `.gitignore` includes `.env` and `.env.*` (except `.env.example`) so local env files are not committed.

### General

- **Dependencies**: Keep server and client dependencies up to date. Run `pip audit` (or `safety check`) for Python and `npm audit` for Node, and address critical/high issues before production.

---

## Production deployment checklist

Before going live:

1. **Server**
   - [ ] Set `ENVIRONMENT=production` and `DEBUG=false` in the server environment.
   - [ ] Set `SECRET_KEY` to a strong random value (e.g. `openssl rand -hex 32`). Do not use the default.
   - [ ] Set `ALLOWED_ORIGINS` to your frontend origin(s) only (e.g. `https://yourdomain.com`). No trailing slashes.
   - [ ] Use HTTPS in production. Run the API behind a reverse proxy (e.g. Nginx, Caddy) that terminates TLS.
   - [ ] If using MongoDB: set `MONGODB_URI` in a secure way (e.g. secret manager or env only). Use TLS and strong credentials; restrict network access (e.g. Atlas IP allowlist).
   - [ ] Ensure `.env` is never committed or deployed to public repos. Use your platform’s secret/config for production values.
   - [ ] Run the server as a non-root user and with minimal required permissions.

2. **Client**
   - [ ] Set `VITE_API_BASE_URL` to your production API base URL (e.g. `https://api.yourdomain.com/api/v1`) when building.
   - [ ] Serve the built client over HTTPS and from the same origin (or an origin allowed by the API’s CORS).

3. **Ongoing**
   - [ ] Run `pip audit` and `npm audit` periodically and fix reported vulnerabilities.
   - [ ] Monitor logs and access patterns for abuse or errors.
   - [ ] If you add authentication later: use secure cookies or Bearer tokens, HTTPS only, and strong `SECRET_KEY` for signing.

---

## Reporting a vulnerability

If you discover a security issue, please report it responsibly (e.g. by contacting the maintainers privately rather than opening a public issue first).
