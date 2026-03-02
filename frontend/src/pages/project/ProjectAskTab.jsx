import { useEffect, useState } from 'react'
import { useOutletContext } from 'react-router-dom'
import { api } from '../../lib/api'

function qaStorageKey(projectId) {
  return `project_qa:${projectId}`
}

export default function ProjectAskTab() {
  const { projectId, askPrefill, setAskPrefill } = useOutletContext()
  const [question, setQuestion] = useState('')
  const [k, setK] = useState(5)
  const [isAsking, setIsAsking] = useState(false)
  const [error, setError] = useState('')
  const [history, setHistory] = useState([])
  const [expandedCitation, setExpandedCitation] = useState('')

  useEffect(() => {
    const cached = localStorage.getItem(qaStorageKey(projectId))
    if (cached) {
      try {
        const parsed = JSON.parse(cached)
        setHistory(Array.isArray(parsed) ? parsed : [])
      } catch {
        setHistory([])
      }
    } else {
      setHistory([])
    }
    setQuestion('')
    setK(5)
    setExpandedCitation('')
    setError('')
  }, [projectId])

  useEffect(() => {
    if (askPrefill?.question) {
      setQuestion(askPrefill.question)
    }
  }, [askPrefill])

  const persistHistory = (nextHistory) => {
    setHistory(nextHistory)
    localStorage.setItem(qaStorageKey(projectId), JSON.stringify(nextHistory))
  }

  const handleAsk = async (event) => {
    event.preventDefault()
    if (!question.trim() || isAsking) return

    setError('')
    setIsAsking(true)
    const userQuestion = question.trim()

    try {
      const response = await api.askProject(projectId, userQuestion, Number(k) || 5)
      const citations = Array.isArray(response?.sources) ? response.sources : []
      const prefetched = askPrefill?.evidence ? [askPrefill.evidence] : []
      const nextHistory = [
        {
          question: userQuestion,
          answer: response?.answer || 'No answer returned.',
          citations: citations.map((citation) => ({ ...citation, text: citation.text || prefetched.find((item) => item.chunk_index === citation.chunk_index)?.text || '' })),
          createdAt: new Date().toISOString(),
        },
        ...history,
      ]
      persistHistory(nextHistory)
      setQuestion('')
      setAskPrefill?.(null)
    } catch (askError) {
      if (askError.message !== 'Unauthorized') {
        setError(askError.message || 'Failed to generate answer.')
      }
    } finally {
      setIsAsking(false)
    }
  }

  const handleClearHistory = () => {
    const confirmed = window.confirm('Clear chat history for this project?')
    if (!confirmed) return

    localStorage.removeItem(qaStorageKey(projectId))
    setHistory([])
    setExpandedCitation('')
    setAskPrefill?.(null)
    setError('')
  }

  const latest = history[0]
  const fallbackCopy = latest?.answer?.includes("I couldn't find anything relevant")

  return (
    <div className="grid gap-4 lg:grid-cols-[2fr,1fr]">
      <div className="space-y-4">
        <form onSubmit={handleAsk} className="surface-card grid gap-3 p-4 md:grid-cols-[1fr,100px,auto]">
          <input className="input-field" placeholder="Ask a research question..." value={question} onChange={(event) => setQuestion(event.target.value)} />
          <input className="input-field" type="number" min="1" max="20" value={k} onChange={(event) => setK(Math.max(1, Math.min(20, Number(event.target.value) || 1)))} />
          <button className="btn-primary" type="submit" disabled={isAsking}>{isAsking ? 'Generating...' : 'Ask'}</button>
        </form>

        {error && <p className="text-sm text-primary">{error}</p>}

        {!latest ? (
          <div className="surface-card p-4 text-sm text-muted">Ask a question and we’ll answer using your sources only.</div>
        ) : (
          <article className="surface-card p-4">
            <p className="text-xs font-semibold uppercase tracking-wide text-muted">Latest answer</p>
            <p className="mt-2 text-sm font-medium">{latest.question}</p>
            <p className={`mt-3 rounded-xl p-3 text-sm ${fallbackCopy ? 'border border-border bg-accent/15 text-text' : 'bg-accent/20'}`}>{latest.answer}</p>
          </article>
        )}

        {!!history.length && (
          <div className="surface-card p-4">
            <div className="flex items-center justify-between gap-2">
              <h3 className="font-semibold">Session History</h3>
              <button
                type="button"
                onClick={handleClearHistory}
                className="rounded-lg border border-border bg-accent/20 px-3 py-1.5 text-xs font-medium text-text transition hover:bg-accent/30"
              >
                Clear history
              </button>
            </div>
            <div className="mt-3 space-y-2">
              {history.map((item, index) => (
                <div key={`${item.createdAt}-${index}`} className="rounded-xl border border-border bg-bg p-3">
                  <p className="text-xs text-muted">{new Date(item.createdAt).toLocaleString()}</p>
                  <p className="mt-1 text-sm font-medium">Q: {item.question}</p>
                  <p className="mt-1 text-sm text-muted">A: {item.answer}</p>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      <aside className="surface-card p-4">
        <h3 className="text-sm font-semibold uppercase tracking-wide text-muted">Citations</h3>
        {!latest?.citations?.length ? (
          <p className="mt-3 text-sm text-muted">No citations yet.</p>
        ) : (
          <ul className="mt-3 space-y-2 text-sm">
            {latest.citations.map((source, index) => {
              const key = `${source.filename}-${source.chunk_index}-${index}`
              const isOpen = expandedCitation === key
              return (
                <li key={key} className="rounded-lg border border-border bg-bg p-2">
                  <button type="button" className="w-full text-left" onClick={() => setExpandedCitation(isOpen ? '' : key)}>
                    {source.filename}, chunk #{source.chunk_index} ({(Number(source.score || 0) * 100).toFixed(1)}%)
                  </button>
                  {isOpen && <p className="mt-2 text-xs text-muted">{source.text || 'Chunk text not available for this citation.'}</p>}
                </li>
              )
            })}
          </ul>
        )}
      </aside>
    </div>
  )
}
