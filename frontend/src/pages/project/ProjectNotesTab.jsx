import { useEffect, useState } from 'react'
import { useOutletContext } from 'react-router-dom'

const templates = ['Hypothesis', 'Method', 'Findings', 'Open Questions']

function notesStorageKey(projectId) {
  return `project_notes:${projectId}`
}

export default function ProjectNotesTab() {
  const { projectId } = useOutletContext()
  const [notes, setNotes] = useState('')

  useEffect(() => {
    setNotes(localStorage.getItem(notesStorageKey(projectId)) || '')
  }, [projectId])

  const updateNotes = (value) => {
    setNotes(value)
    localStorage.setItem(notesStorageKey(projectId), value)
  }

  const insertTemplate = (heading) => {
    const prefix = notes.trim().length ? '\n\n' : ''
    updateNotes(`${notes}${prefix}## ${heading}\n`)
  }

  return (
    <div className="surface-card p-4">
      <div className="flex flex-wrap gap-2">
        {templates.map((template) => (
          <button key={template} type="button" onClick={() => insertTemplate(template)} className="rounded-lg border border-border px-3 py-1.5 text-xs font-medium hover:bg-accent/30">
            {template}
          </button>
        ))}
      </div>
      <textarea className="input-field mt-3 min-h-80" placeholder="Capture hypotheses, methods, findings, and unresolved questions..." value={notes} onChange={(event) => updateNotes(event.target.value)} />
    </div>
  )
}
