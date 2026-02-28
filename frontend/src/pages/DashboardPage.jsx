import { useEffect, useMemo, useState } from "react"
import { Link, useNavigate } from "react-router-dom"

const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL || "http://127.0.0.1:8000"

function SkeletonRow() {
  return (
    <div className="grid grid-cols-[2fr,3fr,auto] gap-3 rounded-xl border border-slate-200 p-3 dark:border-slate-800">
      <div className="h-4 animate-pulse rounded bg-slate-200 dark:bg-slate-700" />
      <div className="h-4 animate-pulse rounded bg-slate-200 dark:bg-slate-700" />
      <div className="h-4 w-16 animate-pulse rounded bg-slate-200 dark:bg-slate-700" />
    </div>
  )
}

export default function DashboardPage() {
  const navigate = useNavigate()
  const [projects, setProjects] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const [loadError, setLoadError] = useState("")

  useEffect(() => {
    const token = localStorage.getItem("token")
    if (!token) {
      navigate("/login")
      return
    }

    async function fetchProjects() {
      try {
        const response = await fetch(`${API_BASE_URL}/projects`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        })

        if (response.status === 401) {
          localStorage.removeItem("token")
          navigate("/login")
          return
        }

        if (!response.ok) throw new Error()

        const data = await response.json()
        setProjects(Array.isArray(data) ? data : [])
      } catch {
        setLoadError("Failed to load projects.")
      } finally {
        setIsLoading(false)
      }
    }

    fetchProjects()
  }, [navigate])

  const totalProjects = useMemo(() => projects.length, [projects])

  return (
    <section className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Dashboard</h1>
        <p className="mt-1 text-sm text-slate-600 dark:text-slate-300">
          You have {totalProjects} project{totalProjects === 1 ? "" : "s"}.
        </p>
      </div>

      <div className="surface-card p-5">
        <h2 className="mb-4 text-lg font-semibold">Projects</h2>

        {isLoading ? (
          <div className="space-y-2">
            <SkeletonRow />
            <SkeletonRow />
            <SkeletonRow />
          </div>
        ) : loadError ? (
          <div className="text-red-500">{loadError}</div>
        ) : projects.length === 0 ? (
          <div className="text-sm text-slate-500">
            No projects yet. Create one via Swagger for now.
          </div>
        ) : (
          <div className="overflow-hidden rounded-xl border border-slate-200 dark:border-slate-800">
            <div className="grid grid-cols-[2fr,3fr,auto] gap-3 bg-slate-100 px-4 py-3 text-xs font-semibold uppercase tracking-wide text-slate-500 dark:bg-slate-800/50">
              <span>Name</span>
              <span>Description</span>
              <span></span>
            </div>

            {projects.map((project) => (
              <div
                key={project.id}
                className="grid grid-cols-[2fr,3fr,auto] items-center gap-3 border-t border-slate-200 px-4 py-3 text-sm dark:border-slate-800"
              >
                <span className="font-medium">{project.name}</span>
                <span className="text-slate-600 dark:text-slate-300">
                  {project.description || "—"}
                </span>
                <Link
                  to={`/projects/${project.id}`}
                  className="rounded-lg bg-slate-100 px-3 py-1.5 text-xs font-medium hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700"
                >
                  Open
                </Link>
              </div>
            ))}
          </div>
        )}
      </div>
    </section>
  )
}