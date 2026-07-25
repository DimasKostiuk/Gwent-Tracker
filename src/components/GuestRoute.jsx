import { Navigate, Outlet } from 'react-router-dom'
import { useAuth } from '../lib/AuthContext'

// Prevents an already-logged-in user from seeing /login or /register.
export default function GuestRoute() {
  const { user, loading } = useAuth()

  if (loading) return null
  if (user) return <Navigate to="/dashboard" replace />

  return <Outlet />
}
