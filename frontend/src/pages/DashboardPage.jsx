import { useState } from 'react'
import { Link } from 'react-router-dom'

const stats = [
  { label: 'Total projects', value: '12' },
  { label: 'Documents indexed', value: '438' },
  { label: 'Searches this week', value: '96' },
]

const projects = [
  { id: 'demo', name: 'Market Trends 2026', docs: 17, updated: '2 hours ago', status: 'Active' },
  { id: 'alpha', name: 'AI Adoption Research', docs: 42, updated: 'Yesterday', status: 'Review' },
]

function SkeletonRow() {
  return (
    <div className="grid grid-cols-[2fr,1fr,1fr,auto] gap-3 rounded-xl border border-slate-200 p-3 dark:border-slate-800">
      <div className="h-4 animate-pulse rounded bg-slate-200 dark:bg-slate-700" />
      <div className="h-4 animate-pulse rounded bg-slate-200 dark:bg-slate-700" />
      <div className="h-4 animate-pulse rounded bg-slate-200 dark:bg-slate-700" />
      <div className="h-4 w-16 animate-pulse rounded bg-slate-200 dark:bg-slate-700" />
    </div>
  )
}

export default function DashboardPage() {
  const [showModal, setShowModal] = useState(false)
  const [isLoading] = useState(false)

  return (
    <section className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-3xl font-bold">Dashboard</h1>
          <p className="mt-1 text-sm text-slate-600 dark:text-slate-300">Track activity and jump back into ongoing research projects.</p>
        </div>
        <button
          onClick={() => setShowModal(true)}
          type="button"
          className="rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-blue-700"
        >
          Create project
        </button>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        {stats.map((item) => (
          <article key={item.label} className="surface-card p-5">
            <p className="text-sm text-slate-500 dark:text-slate-400">{item.label}</p>
            <p className="mt-2 text-3xl font-bold">{item.value}</p>
          </article>
        ))}
      </div>

      <div className="surface-card p-5">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-semibold">Projects</h2>
          <span className="text-xs text-slate-500">Updated recently</span>
        </div>

        {isLoading ? (
          <div className="space-y-2">
            <SkeletonRow />
            <SkeletonRow />
            <SkeletonRow />
          </div>
        ) : projects.length === 0 ? (
          <div className="rounded-xl border border-dashed border-slate-300 p-8 text-center dark:border-slate-700">
            <p className="font-medium">No projects yet</p>
            <p className="mt-1 text-sm text-slate-500">Create your first project to start collecting documents and insights.</p>
          </div>
        ) : (
          <div className="overflow-hidden rounded-xl border border-slate-200 dark:border-slate-800">
            <div className="grid grid-cols-[2fr,1fr,1fr,auto] gap-3 bg-slate-100 px-4 py-3 text-xs font-semibold uppercase tracking-wide text-slate-500 dark:bg-slate-800/50">
              <span>Project</span>
              <span>Docs</span>
              <span>Status</span>
              <span></span>
            </div>
            {projects.map((project) => (
              <div key={project.id} className="grid grid-cols-[2fr,1fr,1fr,auto] items-center gap-3 border-t border-slate-200 px-4 py-3 text-sm dark:border-slate-800">
                <div>
                  <p className="font-medium">{project.name}</p>
                  <p className="text-xs text-slate-500">Updated {project.updated}</p>
                </div>
                <span>{project.docs}</span>
                <span className="text-slate-600 dark:text-slate-300">{project.status}</span>
                <Link to={`/projects/${project.id}`} className="rounded-lg bg-slate-100 px-3 py-1.5 text-xs font-medium hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700">
                  Open
                </Link>
              </div>
            ))}
          </div>
        )}
      </div>

      {showModal && (
        <div className="fixed inset-0 z-50 grid place-items-center bg-slate-950/50 px-4">
          <div className="surface-card w-full max-w-md p-6">
            <h3 className="text-lg font-semibold">Create new project</h3>
            <p className="mt-1 text-sm text-slate-500">Name your project to get started.</p>
            <input className="input-field mt-4" placeholder="Q2 Competitive Landscape" />
            <div className="mt-4 flex justify-end gap-2">
              <button onClick={() => setShowModal(false)} className="rounded-xl border border-slate-300 px-4 py-2 text-sm dark:border-slate-700">
                Cancel
              </button>
              <button onClick={() => setShowModal(false)} className="rounded-xl bg-blue-600 px-4 py-2 text-sm font-semibold text-white">
                Create
              </button>
            </div>
          </div>
        </div>
      )}
    </section>
  )
}
