import { Navigate, Outlet, useLocation } from 'react-router-dom'
import { FullScreenLoader } from '../components/feedback'
import { useAuth } from '../hooks/use-auth'

export function ProtectedRoute() {
  const { profile, loading } = useAuth()
  const location = useLocation()

  if (loading) {
    return <FullScreenLoader message="Carregando sua sessão" />
  }

  if (!profile) {
    return <Navigate to="/auth" replace state={{ from: location }} />
  }

  return <Outlet />
}
