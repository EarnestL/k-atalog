/// <reference types="vite/client" />

interface ImportMetaEnv {
  /** API base URL (e.g. /api/v1 for proxy, or https://api.example.com/api/v1 for production). */
  readonly VITE_API_BASE_URL?: string
  /** Dev server proxy target (e.g. http://127.0.0.1:8000). Only used when running npm run dev. */
  readonly VITE_API_PROXY_TARGET?: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}
