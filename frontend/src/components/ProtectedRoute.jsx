import { useEffect, useState } from 'react'
import { Navigate, Outlet, useLocation } from 'react-router-dom'
import { apiRequest } from '../lib/api'

export default function ProtectedRoute() {
  const location = useLocation()
  const [status, setStatus] = useState('checking')

  useEffect(() => {
    const token = localStorage.getItem('token')

    if (!token) {
      setStatus('unauthenticated')
      return
    }

    apiRequest('/me', { token })
      .then(() => setStatus('authenticated'))
      .catch(() => {
        localStorage.removeItem('token')
        setStatus('unauthenticated')
      })
  }, [location.pathname])

  if (status === 'checking') {
    return <div className="grid min-h-screen place-items-center text-sm text-slate-500">Checking session...</div>
  }

  if (status !== 'authenticated') {
    return <Navigate to="/login" replace state={{ from: location.pathname }} />
  }

  return <Outlet />
}
