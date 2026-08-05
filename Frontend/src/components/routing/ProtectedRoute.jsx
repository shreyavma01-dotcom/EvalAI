import { Navigate, Outlet, useLocation } from 'react-router-dom'
import { useAuth } from '@/hooks/useAuth'
import { Spinner } from '@/components/feedback/Spinner'

/**
 * Gate for authenticated areas. Optionally restricts by role.
 * While the session hydrates, a full-screen loader is shown so the
 * redirect decision is never based on an unloaded session.
 */
export function ProtectedRoute({ roles }) {
  const { user, loading } = useAuth()
  const location = useLocation()

  if (loading) {
    return (
      <div className="grid min-h-screen place-items-center bg-background">
        <div className="flex flex-col items-center gap-3 text-muted">
          <Spinner size="lg" />
          <span className="text-sm">Loading your workspace…</span>
        </div>
      </div>
    )
  }

  if (!user) {
    return <Navigate to="/auth/login" replace state={{ from: location.pathname }} />
  }

  if (roles && !roles.includes(user.role)) {
    return <Navigate to="/" replace />
  }

  return <Outlet />
}

export default ProtectedRoute
