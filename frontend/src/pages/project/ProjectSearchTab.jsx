import { useMemo, useState } from 'react'
import { useNavigate, useOutletContext } from 'react-router-dom'
import { api } from '../../lib/api'

export default function ProjectSearchTab() {
  const navigate = useNavigate()
  const { projectId, setAskPrefill } = useOutletContext()
  const [query, setQuery] = useState('')
  const [k, setK] = useState(5)
  const [minSimilarity, setMinSimilarity] = useState(0.7)
  const [isSearching, setIsSearching] = useState(false)
  const [hasSearched, setHasSearched] = useState(false)
  const [error, setError] = useState('')
  const [results, setResults] = useState([])
  const [expandedKeys, setExpandedKeys] = useState([])

  const filteredResults = useMemo(() => results.filter((item) => Number(item.score || 0) >= minSimilarity), [results, minSimilarity])

  const handleSearch = async (event) => {
    event.preventDefault()
    if (!query.trim() || isSearching) return

    setError('')
    setIsSearching(true)
    try {
      const data = await api.searchProject(projectId, query.trim(), Number(k) || 5)
      setResults(Array.isArray(data?.results) ? data.results : [])
      setExpandedKeys([])
      setHasSearched(true)
    } catch (searchError) {
      if (searchError.message !== 'Unauthorized') {
        setError(searchError.message || 'Failed to search project.')
      }
    } finally {
      setIsSearching(false)
    }
  }

  const toggleExpand = (key) => {
    setExpandedKeys((prev) => (prev.includes(key) ? prev.filter((item) => item !== key) : [...prev, key]))
  }

  const sendToAsk = (result) => {
    const evidence = {
      filename: result.filename,
      chunk_index: result.chunk_index,
      score: result.score,
      text: result.text,
    }
    setAskPrefill?.({ question: query, evidence })
    navigate(`/projects/${projectId}/ask`)
  }

  return (
    <div className="space-y-4">
      <form onSubmit={handleSearch} className="surface-card grid gap-3 p-4 md:grid-cols-[1fr,110px,auto]">
        <input className="input-field" placeholder="Find related passages..." value={query} onChange={(event) => setQuery(event.target.value)} />
        <input className="input-field" type="number" min="1" max="20" value={k} onChange={(event) => setK(Math.max(1, Math.min(20, Number(event.target.value) || 1)))} />
        <button className="btn-primary" type="submit" disabled={isSearching}>{isSearching ? 'Searching...' : 'Run Search'}</button>
      </form>

      <div className="surface-card p-4">
        <label htmlFor="sim-slider" className="text-sm font-medium">Min similarity: {(minSimilarity * 100).toFixed(0)}%</label>
        <input id="sim-slider" className="mt-2 w-full" type="range" min="0" max="1" step="0.01" value={minSimilarity} onChange={(event) => setMinSimilarity(Number(event.target.value))} />
      </div>

      {error && <p className="text-sm text-primary">{error}</p>}

      {!hasSearched ? (
        <p className="text-sm text-muted">Run a search to retrieve supporting passages.</p>
      ) : !filteredResults.length ? (
        <p className="text-sm text-muted">No results above the selected similarity threshold.</p>
      ) : (
        <div className="space-y-3">
          {filteredResults.map((result, index) => {
            const key = `${result.filename}-${result.chunk_index}-${index}`
            const expanded = expandedKeys.includes(key)
            const snippet = result.text?.slice(0, 220) || 'No chunk text returned.'
            return (
              <article key={key} className="surface-card p-4">
                <div className="flex flex-wrap items-start justify-between gap-2">
                  <h3 className="font-semibold">{result.filename}</h3>
                  <button type="button" onClick={() => sendToAsk(result)} className="rounded-lg border border-border px-2 py-1 text-xs font-medium hover:bg-accent/30">Send to Ask</button>
                </div>
                <p className="mt-1 text-xs text-muted">Similarity {(Number(result.score || 0) * 100).toFixed(1)}% • Chunk #{result.chunk_index}</p>
                <p className="mt-2 text-sm text-muted">{expanded ? result.text : `${snippet}${result.text?.length > 220 ? '…' : ''}`}</p>
                <button type="button" onClick={() => toggleExpand(key)} className="mt-2 text-xs font-medium text-primary">{expanded ? 'Collapse' : 'Expand'}</button>
              </article>
            )
          })}
        </div>
      )}
    </div>
  )
}
