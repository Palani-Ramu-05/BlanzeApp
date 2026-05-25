import { Navigate, Outlet } from 'react-router-dom'
import { useAppSelector } from '@core/hooks/useStore'
import { ROUTES } from '@core/constants/constants'
import { FullPageLoader } from '@components/index'

export const ProtectedRoute = () => {
  const { isAuthenticated, initializing } = useAppSelector((s) => s.auth)
  if (initializing) return <FullPageLoader />
  return isAuthenticated ? <Outlet /> : <Navigate to={ROUTES.AUTH.SIGNIN} replace />
}
