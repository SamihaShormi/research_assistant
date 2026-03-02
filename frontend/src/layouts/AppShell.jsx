import { useEffect, useState } from 'react'
import { Link, Outlet, useLocation, useNavigate } from 'react-router-dom'
import Navbar from '../components/Navbar'
import { api } from '../lib/api'

export default function AppShell() {
  const location = useLocation()
  const navigate = useNavigate()
  const [projects, setProjects] = useState([])

  const fetchProjects = async () => {
    try {
      const data = await api.getProjects()
      setProjects(Array.isArray(data) ? data : [])
    } catch (error) {
      if (error.message !== 'Unauthorized') {
        setProjects([])
      }
    }
  }

  useEffect(() => {
    fetchProjects()
  }, [])

  return (
    <div className="min-h-screen bg-bg text-text">
      <Navbar />
      <div className="mx-auto flex w-full max-w-7xl gap-6 px-4 py-6 sm:px-6">
        <aside className="hidden h-fit w-72 shrink-0 surface-card p-4 md:block">
          <p className="px-3 text-xs font-semibold uppercase tracking-[0.2em] text-muted">Workspace</p>
          <nav className="mt-3 space-y-1.5">
            <Link
              to="/dashboard"
              className={`flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition ${
                location.pathname.startsWith('/dashboard') ? 'bg-primary text-primary-foreground shadow-sm' : 'text-muted hover:bg-accent/30 hover:text-text'
              }`}
            >
              <span>▦</span>
              <span>Dashboard</span>
            </Link>

            <Link
              to="/projects"
              className={`flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition ${
                location.pathname === '/projects' ? 'bg-primary text-primary-foreground shadow-sm' : 'text-muted hover:bg-accent/30 hover:text-text'
              }`}
            >
              <span>◉</span>
              <span>Projects</span>
            </Link>
          </nav>
          <button
            type="button"
            onClick={() => {
              localStorage.removeItem('token')
              navigate('/login')
            }}
            className="mt-6 w-full rounded-xl border border-border px-3 py-2 text-sm font-medium text-muted transition hover:bg-accent/30"
          >
            Sign out
          </button>
        </aside>
        <main className="w-full">
          <Outlet context={{ projects, refreshProjects: fetchProjects }} />
        </main>
      </div>
    </div>
  )
}
