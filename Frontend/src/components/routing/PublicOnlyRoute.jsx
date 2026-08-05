import { Navigate } from 'react-router-dom'
import { useAuth } from '@/hooks/useAuth'
import { Spinner } from '@/components/feedback/Spinner'

/**
 * Gate for public pages. Authenticated users are sent to their dashboard.
 */
export function PublicOnlyRoute({ children }) {
  const { user, loading } = useAuth()

  if (loading) {
    return (
      <div className="grid min-h-screen place-items-center bg-background">
        <Spinner size="lg" />
      </div>
    )
  }

  if (user) {
    const home = user.role === 'admin' ? '/admin/dashboard' : user.role === 'teacher' ? '/teacher/dashboard' : '/student/dashboard'
    return <Navigate to={home} replace />
  }

  return children
}

export default PublicOnlyRoute
