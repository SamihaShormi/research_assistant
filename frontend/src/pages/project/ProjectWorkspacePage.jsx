import { useEffect, useMemo, useState } from 'react'
import { NavLink, Navigate, Outlet, useLocation, useOutletContext, useParams } from 'react-router-dom'
import { api } from '../../lib/api'

const PROJECT_TABS = [
  { label: 'Sources', path: 'sources' },
  { label: 'Search', path: 'search' },
  { label: 'Ask', path: 'ask' },
  { label: 'Notes', path: 'notes' },
  { label: 'Activity', path: 'activity' },
]

function QuickAction({ to, label }) {
  return (
    <NavLink to={to} className="rounded-lg border border-border px-3 py-1.5 text-xs font-medium text-muted transition hover:bg-accent/30 hover:text-text">
      {label}
    </NavLink>
  )
}

export default function ProjectWorkspacePage() {
  const { projectId = '' } = useParams()
  const { projects = [] } = useOutletContext() || {}
  const location = useLocation()

  const [project, setProject] = useState(null)
  const [isLoadingProject, setIsLoadingProject] = useState(true)
  const [projectError, setProjectError] = useState('')
  const [askPrefill, setAskPrefill] = useState(null)

  const numericId = Number(projectId)

  useEffect(() => {
    if (!Number.isFinite(numericId)) {
      setProjectError('Invalid project id.')
      setIsLoadingProject(false)
      return
    }

    const inList = projects.find((item) => item.id === numericId)
    if (inList) {
      setProject(inList)
      setProjectError('')
      setIsLoadingProject(false)
      return
    }

    setIsLoadingProject(true)
    setProjectError('')
    api
      .getProject(projectId)
      .then((data) => {
        if (!data) {
          setProject(null)
          setProjectError('Project not found.')
          return
        }
        setProject(data)
      })
      .catch((error) => {
        if (error.message !== 'Unauthorized') {
          setProjectError(error.message || 'Failed to load project.')
        }
      })
      .finally(() => setIsLoadingProject(false))
  }, [numericId, projects])

  const tabLinks = useMemo(() => PROJECT_TABS.map((tab) => ({ ...tab, url: `/projects/${projectId}/${tab.path}` })), [projectId])

  if (location.pathname === `/projects/${projectId}`) {
    return <Navigate to={`/projects/${projectId}/sources`} replace />
  }

  return (
    <section className="space-y-5">
      <header className="surface-card p-6">
        <p className="text-xs font-semibold uppercase tracking-wide text-muted">Research workspace</p>
        <h1 className="mt-2 text-3xl font-bold">{isLoadingProject ? 'Loading project...' : project?.name || 'Unknown project'}</h1>
        <p className="mt-2 text-sm text-muted">{project?.description || 'Add a project description to define your research scope and objectives.'}</p>
        {projectError && <p className="mt-2 text-sm text-primary">{projectError}</p>}

        <div className="mt-4 flex flex-wrap gap-2">
          <QuickAction to={`/projects/${projectId}/sources`} label="Upload" />
          <QuickAction to={`/projects/${projectId}/search`} label="Search" />
          <QuickAction to={`/projects/${projectId}/ask`} label="Ask" />
          <QuickAction to={`/projects/${projectId}/notes`} label="Notes" />
        </div>
      </header>

      <nav className="surface-card flex flex-wrap gap-2 p-3">
        {tabLinks.map((tab) => (
          <NavLink
            key={tab.path}
            to={tab.url}
            className={({ isActive }) =>
              `rounded-xl px-4 py-2 text-sm font-medium transition ${
                isActive ? 'bg-primary text-primary-foreground shadow-sm' : 'text-muted hover:bg-accent/30 hover:text-text'
              }`
            }
          >
            {tab.label}
          </NavLink>
        ))}
      </nav>

      <Outlet context={{ projectId, askPrefill, setAskPrefill }} />
    </section>
  )
}
