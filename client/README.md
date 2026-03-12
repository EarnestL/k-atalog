# K-atalog Client

React + TypeScript frontend for **K-atalog**, a K-pop photocard database platform.

## Tech stack

- **React 18** + **TypeScript**
- **Vite** (dev server + build)
- **React Router** for routing
- **Supabase** (`@supabase/supabase-js`) for authentication + storage uploads

## How it works (high level)

- **Routing**: `src/App.tsx` defines routes for landing, search, group/member pages, login/register, and submissions.
- **API client**: `src/api/client.ts` wraps `fetch` and talks to the FastAPI backend under `/api/v1`.
  - In dev, requests to `/api/...` are proxied to the backend via `vite.config.ts`.
  - When logged in, the client attaches a Supabase **Bearer token** to API requests.
- **Auth**:
  - `src/contexts/AuthContext.tsx` manages Supabase session state and provides `signIn`, `signUp`, `signOut`.
  - When logged out, the profile button opens an auth overlay with Log in / Sign up actions.
- **Submissions**:
  - Logged-in users can submit new photocards via an overlay (`AddPhotocardOverlay`).
  - The form uploads images to Supabase Storage and then creates the photocard via the backend.

## Environment variables

Copy `client/.env.example` to `client/.env`.

- `VITE_API_PROXY_TARGET` *(dev only)*: backend origin for the Vite proxy (default `http://127.0.0.1:8000`)
- `VITE_API_BASE_URL` *(optional)*: call the API directly instead of using the dev proxy (requires backend CORS)
- `VITE_SUPABASE_URL`: Supabase project URL
- `VITE_SUPABASE_ANON_KEY`: Supabase anon (public) key

## Run locally

```bash
cd client
npm install
cp .env.example .env
npm run dev
```

Open: `http://localhost:5173`
