# Security

- **Secrets**: No secrets in code. `MONGODB_URI` and `SECRET_KEY` come from environment only. `.env` is gitignored.
- **Production**: With `ENVIRONMENT=production`, the app requires a non-default `SECRET_KEY`. Docs (`/docs`, `/redoc`) are disabled when not in debug.
- **CORS**: Configurable via `ALLOWED_ORIGINS`. API allows only `GET` and `OPTIONS`.
- **Headers**: `X-Content-Type-Options: nosniff`, `X-Frame-Options: DENY`, `X-XSS-Protection`, `Referrer-Policy`.
- **Input**: Search query max 500 chars; path params max 200 chars. Error details in responses only when `DEBUG=true`.
- **MongoDB**: Parameterized queries only; no user input in raw queries. URI never logged.
- **Client**: No `dangerouslySetInnerHTML` or `eval`. Only `VITE_*` env vars are in the build; do not put secrets there.
