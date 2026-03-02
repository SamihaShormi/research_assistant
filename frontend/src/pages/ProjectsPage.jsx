import { useMemo, useState } from 'react'
import { Link, useNavigate, useOutletContext } from 'react-router-dom'
import { api } from '../lib/api'

export default function ProjectsPage() {
  const navigate = useNavigate()
  const { projects = [], refreshProjects } = useOutletContext() || {}

  const [query, setQuery] = useState('')
  const [isCreating, setIsCreating] = useState(false)
  const [createError, setCreateError] = useState('')

  const filteredProjects = useMemo(() => {
    const normalized = query.trim().toLowerCase()
    if (!normalized) return projects

    return projects.filter((project) => project.name.toLowerCase().includes(normalized))
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
      const created = await api.createProject({
        name,
        description: description || null,
      })
      await refreshProjects?.()
      event.currentTarget.reset()

      if (created?.id) {
        navigate(`/projects/${created.id}`)
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
        <h1 className="text-3xl font-bold">Projects</h1>
        <p className="mt-2 text-sm text-muted">Browse all projects and search by project name.</p>

        <div className="mt-4 grid gap-3 md:grid-cols-[1fr,auto]">
          <input
            className="input-field"
            placeholder="Search projects by name..."
            value={query}
            onChange={(event) => setQuery(event.target.value)}
          />
        </div>
      </header>

      <form className="surface-card space-y-3 p-4" onSubmit={handleCreateProject}>
        <h2 className="text-lg font-semibold">Create Project</h2>
        <div className="grid gap-3 md:grid-cols-2">
          <input name="name" className="input-field" placeholder="Project name" required />
          <input name="description" className="input-field" placeholder="Description (optional)" />
        </div>
        {createError && <p className="text-sm text-primary">{createError}</p>}
        <button type="submit" className="btn-primary" disabled={isCreating}>
          {isCreating ? 'Creating...' : 'Create Project'}
        </button>
      </form>

      {!filteredProjects.length ? (
        <div className="rounded-xl border border-dashed border-border p-8 text-center">
          <p className="font-medium">No matching projects</p>
          <p className="mt-1 text-sm text-muted">Try a different project name in search.</p>
        </div>
      ) : (
        <div className="overflow-hidden rounded-xl border border-border">
          <div className="grid grid-cols-[2fr,3fr,auto] gap-3 bg-accent/25 px-4 py-3 text-xs font-semibold uppercase tracking-wide text-muted">
            <span>Name</span>
            <span>Description</span>
            <span></span>
          </div>

          {filteredProjects.map((project) => (
            <div key={project.id} className="grid grid-cols-[2fr,3fr,auto] items-center gap-3 border-t border-border px-4 py-3 text-sm">
              <span className="font-medium">{project.name}</span>
              <span className="text-muted">{project.description || '—'}</span>
              <Link to={`/projects/${project.id}`} className="rounded-lg bg-accent/30 px-3 py-1.5 text-xs font-medium hover:bg-accent/50">
                Open
              </Link>
            </div>
          ))}
        </div>
      )}
    </section>
  )
}
