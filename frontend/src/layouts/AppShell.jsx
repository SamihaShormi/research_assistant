import { useEffect, useState } from 'react'
import { Link, Outlet, useLocation, useNavigate } from 'react-router-dom'
import Navbar from '../components/Navbar'
import { api } from '../lib/api'

export default function AppShell() {
  const location = useLocation()
  const navigate = useNavigate()
  const [projects, setProjects] = useState([])
  const [isLoadingProjects, setIsLoadingProjects] = useState(true)
  const [projectsError, setProjectsError] = useState('')
  const [showCreateProject, setShowCreateProject] = useState(false)
  const [createProjectError, setCreateProjectError] = useState('')
  const [isCreatingProject, setIsCreatingProject] = useState(false)

  const fetchProjects = async () => {
    setIsLoadingProjects(true)
    setProjectsError('')

    try {
      const data = await api.getProjects()
      setProjects(Array.isArray(data) ? data : [])
    } catch (error) {
      if (error.message !== 'Unauthorized') {
        setProjectsError(error.message || 'Failed to load projects.')
      }
    } finally {
      setIsLoadingProjects(false)
    }
  }

  useEffect(() => {
    fetchProjects()
  }, [])

  const handleCreateProject = async (event) => {
    event.preventDefault()

    if (isCreatingProject) return

    const form = new FormData(event.currentTarget)
    const name = String(form.get('name') || '').trim()
    const description = String(form.get('description') || '').trim()

    if (!name) {
      setCreateProjectError('Project name is required.')
      return
    }

    setCreateProjectError('')
    setIsCreatingProject(true)

    try {
      const created = await api.createProject({
        name,
        description: description || null,
      })
      await fetchProjects()
      setShowCreateProject(false)
      event.currentTarget.reset()
      if (created?.id) {
        navigate(`/projects/${created.id}`)
      }
    } catch (error) {
      if (error.message !== 'Unauthorized') {
        setCreateProjectError(error.message || 'Failed to create project.')
      }
    } finally {
      setIsCreatingProject(false)
    }
  }

  return (
    <div className="min-h-screen bg-bg text-text">
      <Navbar />
      <div className="mx-auto flex w-full max-w-7xl gap-6 px-4 py-6 sm:px-6">
        <aside className="hidden h-fit w-72 shrink-0 surface-card p-4 md:block">
          <div className="flex items-center justify-between gap-2 px-1">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-muted">Workspace</p>
            <button type="button" className="rounded-lg bg-primary px-2 py-1 text-xs font-semibold text-primary-foreground" onClick={() => setShowCreateProject(true)}>
              Create
            </button>
          </div>

          {showCreateProject && (
            <form onSubmit={handleCreateProject} className="mt-3 space-y-2 rounded-xl border border-border p-3">
              <input name="name" className="input-field" placeholder="Project name" required />
              <textarea name="description" className="input-field min-h-16" placeholder="Description (optional)" />
              {createProjectError && <p className="text-xs text-primary">{createProjectError}</p>}
              <div className="flex gap-2">
                <button type="submit" className="btn-primary flex-1 text-xs" disabled={isCreatingProject}>
                  {isCreatingProject ? 'Creating...' : 'Create Project'}
                </button>
                <button
                  type="button"
                  className="flex-1 rounded-lg border border-border px-3 py-2 text-xs"
                  onClick={() => {
                    setShowCreateProject(false)
                    setCreateProjectError('')
                  }}
                >
                  Cancel
                </button>
              </div>
            </form>
          )}

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

            {isLoadingProjects ? (
              <p className="px-3 py-2 text-xs text-muted">Loading projects...</p>
            ) : projectsError ? (
              <p className="px-3 py-2 text-xs text-primary">{projectsError}</p>
            ) : projects.length === 0 ? (
              <div className="rounded-xl border border-dashed border-border px-3 py-4 text-xs text-muted">
                No projects yet.
                <button type="button" className="mt-2 block text-primary underline" onClick={() => setShowCreateProject(true)}>
                  Create Project
                </button>
              </div>
            ) : (
              projects.map((item) => {
                const projectPath = `/projects/${item.id}`
                const active = location.pathname.startsWith(projectPath)
                return (
                  <Link
                    key={item.id}
                    to={projectPath}
                    className={`flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition ${
                      active ? 'bg-primary text-primary-foreground shadow-sm' : 'text-muted hover:bg-accent/30 hover:text-text'
                    }`}
                  >
                    <span>◉</span>
                    <span className="truncate">{item.name}</span>
                  </Link>
                )
              })
            )}
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
