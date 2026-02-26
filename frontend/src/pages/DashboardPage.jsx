import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { apiRequest } from '../lib/api'

function formatDate(dateString) {
  return new Date(dateString).toLocaleString()
}

export default function DashboardPage() {
  const [showModal, setShowModal] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [projects, setProjects] = useState([])
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [error, setError] = useState('')

  const token = localStorage.getItem('token')

  const loadProjects = async () => {
    try {
      setIsLoading(true)
      const data = await apiRequest('/projects', { token })
      setProjects(data)
    } catch (requestError) {
      setError(requestError.message)
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    loadProjects()
  }, [])

  const handleCreateProject = async (event) => {
    event.preventDefault()
    if (!name.trim()) {
      setError('Project name is required.')
      return
    }

    try {
      setError('')
      const created = await apiRequest('/projects', {
        method: 'POST',
        token,
        body: { name: name.trim(), description: description.trim() || null },
      })
      setProjects((current) => [created, ...current])
      setShowModal(false)
      setName('')
      setDescription('')
    } catch (requestError) {
      setError(requestError.message)
    }
  }

  const handleDelete = async (projectId) => {
    try {
      await apiRequest(`/projects/${projectId}`, { method: 'DELETE', token })
      setProjects((current) => current.filter((project) => project.id !== projectId))
    } catch (requestError) {
      setError(requestError.message)
    }
  }

  return (
    <section className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-3xl font-bold">Dashboard</h1>
          <p className="mt-1 text-sm text-slate-600 dark:text-slate-300">Manage your research projects.</p>
        </div>
        <button
          onClick={() => setShowModal(true)}
          type="button"
          className="rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-blue-700"
        >
          Create project
        </button>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <article className="surface-card p-5">
          <p className="text-sm text-slate-500 dark:text-slate-400">Total projects</p>
          <p className="mt-2 text-3xl font-bold">{projects.length}</p>
        </article>
        <article className="surface-card p-5">
          <p className="text-sm text-slate-500 dark:text-slate-400">Latest update</p>
          <p className="mt-2 text-sm font-medium">{projects[0] ? formatDate(projects[0].created_at) : 'No projects yet'}</p>
        </article>
      </div>

      {error && <div className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">{error}</div>}

      <div className="surface-card p-5">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-semibold">Projects</h2>
        </div>

        {isLoading ? (
          <div className="text-sm text-slate-500">Loading projects...</div>
        ) : projects.length === 0 ? (
          <div className="rounded-xl border border-dashed border-slate-300 p-8 text-center dark:border-slate-700">
            <p className="font-medium">No projects yet</p>
          </div>
        ) : (
          <div className="overflow-hidden rounded-xl border border-slate-200 dark:border-slate-800">
            <div className="grid grid-cols-[2fr,2fr,auto,auto] gap-3 bg-slate-100 px-4 py-3 text-xs font-semibold uppercase tracking-wide text-slate-500 dark:bg-slate-800/50">
              <span>Project</span>
              <span>Description</span>
              <span>Created</span>
              <span></span>
            </div>
            {projects.map((project) => (
              <div key={project.id} className="grid grid-cols-[2fr,2fr,auto,auto] items-center gap-3 border-t border-slate-200 px-4 py-3 text-sm dark:border-slate-800">
                <div>
                  <p className="font-medium">{project.name}</p>
                </div>
                <span className="text-slate-600 dark:text-slate-300">{project.description || '-'}</span>
                <span className="text-xs text-slate-500">{formatDate(project.created_at)}</span>
                <div className="flex items-center gap-2">
                  <Link to={`/projects/${project.id}`} className="rounded-lg bg-slate-100 px-3 py-1.5 text-xs font-medium hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700">
                    Open
                  </Link>
                  <button onClick={() => handleDelete(project.id)} className="rounded-lg border border-rose-200 px-3 py-1.5 text-xs font-medium text-rose-600 hover:bg-rose-50">
                    Delete
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {showModal && (
        <div className="fixed inset-0 z-50 grid place-items-center bg-slate-950/50 px-4">
          <form onSubmit={handleCreateProject} className="surface-card w-full max-w-md p-6">
            <h3 className="text-lg font-semibold">Create new project</h3>
            <p className="mt-1 text-sm text-slate-500">Name your project to get started.</p>
            <input value={name} onChange={(event) => setName(event.target.value)} className="input-field mt-4" placeholder="Q2 Competitive Landscape" />
            <textarea value={description} onChange={(event) => setDescription(event.target.value)} className="input-field mt-3 min-h-24" placeholder="Optional description" />
            <div className="mt-4 flex justify-end gap-2">
              <button type="button" onClick={() => setShowModal(false)} className="rounded-xl border border-slate-300 px-4 py-2 text-sm dark:border-slate-700">
                Cancel
              </button>
              <button type="submit" className="rounded-xl bg-blue-600 px-4 py-2 text-sm font-semibold text-white">
                Create
              </button>
            </div>
          </form>
        </div>
      )}
    </section>
  )
}
