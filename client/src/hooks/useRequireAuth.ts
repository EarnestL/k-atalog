import { useEffect } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'

/**
 * Redirect to /login if not authenticated.
 * Use for future protected routes (e.g. history, settings).
 * Preserves intended destination in ?redirect= for post-login redirect.
 */
export function useRequireAuth() {
  const { user, loading } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()

  useEffect(() => {
    if (loading) return
    if (!user) {
      const redirect = encodeURIComponent(location.pathname + location.search)
      navigate(`/login?redirect=${redirect}`, { replace: true })
    }
  }, [user, loading, navigate, location.pathname, location.search])

  return { user, loading }
}
