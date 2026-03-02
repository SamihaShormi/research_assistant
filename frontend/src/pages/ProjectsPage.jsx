import { useMemo, useState } from 'react'
import { Link, useNavigate, useOutletContext } from 'react-router-dom'
import { api } from '../lib/api'

function formatDate(value) {
  if (!value) return 'Recently'
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return 'Recently'
  return date.toLocaleDateString()
}

export default function ProjectsPage() {
  const navigate = useNavigate()
  const { projects = [], refreshProjects } = useOutletContext() || {}
  const [query, setQuery] = useState('')
  const [isCreateOpen, setIsCreateOpen] = useState(false)
  const [isCreating, setIsCreating] = useState(false)
  const [createError, setCreateError] = useState('')

  const filteredProjects = useMemo(() => {
    const normalized = query.trim().toLowerCase()
    if (!normalized) return projects

    return projects.filter((project) => {
      const name = (project.name || '').toLowerCase()
      const description = (project.description || '').toLowerCase()
      return name.includes(normalized) || description.includes(normalized)
    })
  }, [projects, query])

  const handleCreateProject = async (event) => {
    event.preventDefault()
    if (isCreating) return

    const formData = new FormData(event.currentTarget)
    const name = String(formData.get('name') || '').trim()
    const description = String(formData.get('description') || '').trim()

    if (!name) {
      setCreateError('Project name is required.')
      return
    }

    setCreateError('')
    setIsCreating(true)
    try {
      const created = await api.createProject({ name, description: description || null })
      await refreshProjects?.()
      setIsCreateOpen(false)
      if (created?.id) {
        navigate(`/projects/${created.id}/sources`)
      }
    } catch (error) {
      if (error.message !== 'Unauthorized') {
        setCreateError(error.message || 'Failed to create project.')
      }
    } finally {
      setIsCreating(false)
    }
  }

  return (
    <section className="space-y-6">
      <header className="surface-card p-6">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold">Research Projects</h1>
            <p className="mt-2 text-sm text-muted">Create a workspace, upload sources, run semantic search, and generate cited answers.</p>
          </div>
          <button type="button" className="btn-primary" onClick={() => setIsCreateOpen(true)}>
            Create Project
          </button>
        </div>
        <input
          className="input-field mt-4"
          placeholder="Search by project title or description..."
          value={query}
          onChange={(event) => setQuery(event.target.value)}
        />
      </header>

      {!filteredProjects.length ? (
        <div className="rounded-xl border border-dashed border-border p-8 text-center">
          <p className="font-medium">No projects found</p>
          <p className="mt-1 text-sm text-muted">Create a project to start your research session.</p>
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {filteredProjects.map((project) => (
            <Link key={project.id} to={`/projects/${project.id}/sources`} className="surface-card block p-5 transition hover:-translate-y-0.5 hover:shadow-md">
              <h2 className="text-lg font-semibold">{project.name}</h2>
              <p className="mt-2 line-clamp-3 text-sm text-muted">{project.description || 'No description added yet.'}</p>
              <p className="mt-4 text-xs font-medium uppercase tracking-wide text-muted">Updated {formatDate(project.updated_at || project.created_at)}</p>
            </Link>
          ))}
        </div>
      )}

      {isCreateOpen && (
        <div className="fixed inset-0 z-40 grid place-items-center bg-black/35 p-4">
          <div className="surface-card w-full max-w-lg p-6">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-semibold">Create Project</h2>
              <button type="button" className="text-sm text-muted" onClick={() => setIsCreateOpen(false)}>
                Close
              </button>
            </div>

            <form className="mt-4 space-y-3" onSubmit={handleCreateProject}>
              <input name="name" className="input-field" placeholder="Project name" required />
              <textarea name="description" className="input-field min-h-24" placeholder="Project description" />
              {createError && <p className="text-sm text-primary">{createError}</p>}
              <button type="submit" className="btn-primary" disabled={isCreating}>
                {isCreating ? 'Creating...' : 'Create'}
              </button>
            </form>
          </div>
        </div>
      )}
    </section>
  )
}
