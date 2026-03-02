import { useEffect, useState } from 'react'
import { useOutletContext } from 'react-router-dom'
import { api } from '../../lib/api'

export default function ProjectActivityTab() {
  const { projectId } = useOutletContext()
  const [activity, setActivity] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    setIsLoading(true)
    setError('')

    api
      .getProjectActivity(projectId)
      .then((data) => {
        setActivity(Array.isArray(data) ? data : [])
      })
      .catch((fetchError) => {
        if (fetchError.message !== 'Unauthorized') {
          setError(fetchError.message || 'Failed to load activity.')
        }
      })
      .finally(() => {
        setIsLoading(false)
      })
  }, [projectId])

  return (
    <div className="surface-card p-4">
      <h3 className="font-semibold">Recent activity</h3>
      {isLoading ? (
        <div className="mt-3 space-y-2">
          <div className="h-12 animate-pulse rounded-xl bg-accent/30" />
          <div className="h-12 animate-pulse rounded-xl bg-accent/30" />
        </div>
      ) : error ? (
        <p className="mt-2 text-sm text-primary">{error}</p>
      ) : !activity.length ? (
        <p className="mt-2 text-sm text-muted">No activity yet for this project.</p>
      ) : (
        <ul className="mt-3 space-y-2 text-sm">
          {activity.map((item, index) => (
            <li key={`${item.type}-${item.filename}-${item.created_at}-${index}`} className="rounded-xl border border-border bg-bg p-3">
              <p className="text-xs text-muted">{item.created_at ? new Date(item.created_at).toLocaleString() : 'Unknown time'}</p>
              <p className="mt-1">Source uploaded: {item.filename}</p>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
