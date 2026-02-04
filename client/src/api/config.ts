/**
 * API base URL for the backend.
 *
 * - Development: leave unset to use the Vite proxy (/api/v1 → backend).
 * - Or set VITE_API_BASE_URL=http://127.0.0.1:8000/api/v1 to call the backend directly.
 * - Production: set VITE_API_BASE_URL to your API origin, e.g. https://api.example.com/api/v1
 */

function getApiBase(): string {
  const raw = import.meta.env.VITE_API_BASE_URL
  if (raw == null || raw === '') {
    return '/api/v1'
  }
  return raw.replace(/\/$/, '') // strip trailing slash
}

export const apiBase = getApiBase()
