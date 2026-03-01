import { useEffect, useMemo, useState } from 'react'
import { useOutletContext, useParams } from 'react-router-dom'
import { api } from '../lib/api'
import '../lib/types'

const tabs = ['Documents', 'Search', 'Chat', 'Notes']

function DocumentsTab({ projectId }) {
  const [documents, setDocuments] = useState([])
  const [isLoadingDocs, setIsLoadingDocs] = useState(true)
  const [docsError, setDocsError] = useState('')
  const [textError, setTextError] = useState('')
  const [pdfError, setPdfError] = useState('')
  const [successMessage, setSuccessMessage] = useState('')
  const [isUploadingText, setIsUploadingText] = useState(false)
  const [isUploadingPdf, setIsUploadingPdf] = useState(false)

  const fetchDocuments = async () => {
    setIsLoadingDocs(true)
    setDocsError('')

    try {
      const data = await api.getProjectDocuments(projectId)
      setDocuments(Array.isArray(data) ? data : [])
    } catch (error) {
      if (error.message !== 'Unauthorized') {
        setDocsError(error.message || 'Failed to load documents for this project.')
      }
      setDocuments([])
    } finally {
      setIsLoadingDocs(false)
    }
  }

  useEffect(() => {
    setDocuments([])
    setIsLoadingDocs(true)
    setDocsError('')
    setTextError('')
    setPdfError('')
    setSuccessMessage('')

    fetchDocuments()
  }, [projectId])

  const handleTextUpload = async (event) => {
    event.preventDefault()
    if (isUploadingText) return

    const form = new FormData(event.currentTarget)
    const filename = String(form.get('filename') || '').trim()
    const content = String(form.get('content') || '').trim()

    if (!filename || !content) {
      setTextError('Filename and content are required.')
      return
    }

    setTextError('')
    setSuccessMessage('')
    setIsUploadingText(true)

    try {
      await api.uploadTextDocument(projectId, { filename, content })
      await fetchDocuments()
      setSuccessMessage(`Uploaded ${filename} successfully.`)
      event.currentTarget.reset()
    } catch (error) {
      if (error.message !== 'Unauthorized') {
        setTextError(error.message || 'Failed to upload text document.')
      }
    } finally {
      setIsUploadingText(false)
    }
  }

  const handlePdfUpload = async (event) => {
    event.preventDefault()
    if (isUploadingPdf) return

    const form = new FormData(event.currentTarget)
    const file = form.get('file')

    if (!(file instanceof File) || !file.name) {
      setPdfError('Please choose a PDF file.')
      return
    }

    setPdfError('')
    setSuccessMessage('')
    setIsUploadingPdf(true)

    try {
      await api.uploadPdfDocument(projectId, file)
      await fetchDocuments()
      setSuccessMessage(`Uploaded ${file.name} successfully.`)
      event.currentTarget.reset()
    } catch (error) {
      if (error.message !== 'Unauthorized') {
        setPdfError(error.message || 'Failed to upload PDF document.')
      }
    } finally {
      setIsUploadingPdf(false)
    }
  }

  return (
    <div className="space-y-4">
      <div className="grid gap-4 lg:grid-cols-2">
        <form className="surface-card space-y-3 p-4" onSubmit={handleTextUpload}>
          <h3 className="font-semibold">Upload Text</h3>
          <input name="filename" className="input-field" placeholder="notes.txt" required />
          <textarea name="content" className="input-field min-h-28" placeholder="Paste document content..." required />
          {textError && <p className="text-xs text-primary">{textError}</p>}
          <button type="submit" className="btn-primary" disabled={isUploadingText}>
            {isUploadingText ? 'Uploading...' : 'Upload Text'}
          </button>
        </form>

        <form className="surface-card space-y-3 p-4" onSubmit={handlePdfUpload}>
          <h3 className="font-semibold">Upload PDF</h3>
          <input name="file" type="file" accept="application/pdf,.pdf" className="input-field" required />
          {pdfError && <p className="text-xs text-primary">{pdfError}</p>}
          <button type="submit" className="btn-primary" disabled={isUploadingPdf}>
            {isUploadingPdf ? 'Uploading...' : 'Upload PDF'}
          </button>
        </form>
      </div>

      {successMessage && <p className="rounded-lg border border-border bg-accent/20 px-3 py-2 text-sm">{successMessage}</p>}

      {isLoadingDocs ? (
        <div className="rounded-xl border border-dashed border-border p-8 text-center">
          <p className="font-medium">Loading documents...</p>
        </div>
      ) : docsError ? (
        <div className="rounded-xl border border-dashed border-border p-8 text-center">
          <p className="font-medium">Unable to load documents.</p>
          <p className="mt-1 text-sm text-muted">{docsError}</p>
        </div>
      ) : !documents.length ? (
        <div className="rounded-xl border border-dashed border-border p-8 text-center">
          <p className="font-medium">No documents uploaded yet</p>
          <p className="mt-1 text-sm text-muted">Upload text or PDF files to create indexed chunks.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {documents.map((doc, index) => (
            <article key={`${doc.id ?? doc.name}-${index}`} className="surface-card p-4">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <h3 className="font-medium">{doc.filename || doc.name || 'Untitled document'}</h3>
                  <p className="text-xs text-muted">{doc.chunks_created ?? doc.chunks ?? 0} chunks</p>
                </div>
                <span className="rounded-full bg-primary px-3 py-1 text-xs font-semibold text-primary-foreground">{doc.status || 'Indexed'}</span>
              </div>
            </article>
          ))}
        </div>
      )}
    </div>
  )
}

function SearchTab({ projectId }) {
  const [query, setQuery] = useState('')
  const [k, setK] = useState(5)
  const [minSimilarity, setMinSimilarity] = useState(0.75)
  const [isSearching, setIsSearching] = useState(false)
  const [hasSearched, setHasSearched] = useState(false)
  const [error, setError] = useState('')
  const [results, setResults] = useState([])

  useEffect(() => {
    setQuery('')
    setK(5)
    setError('')
    setResults([])
    setHasSearched(false)
    setMinSimilarity(0.75)
  }, [projectId])

  const filteredResults = useMemo(() => results.filter((item) => item.score >= minSimilarity), [results, minSimilarity])

  const handleSearch = async (event) => {
    event.preventDefault()
    if (!query.trim() || isSearching) return

    setError('')
    setIsSearching(true)

    try {
      const data = await api.searchProject(projectId, query.trim(), Number(k) || 5)
      setResults(Array.isArray(data?.results) ? data.results : [])
      setHasSearched(true)
    } catch (searchError) {
      if (searchError.message !== 'Unauthorized') {
        setError(searchError.message || 'Failed to search project.')
      }
    } finally {
      setIsSearching(false)
    }
  }

  return (
    <div className="space-y-4">
      <form onSubmit={handleSearch} className="surface-card grid gap-3 p-4 md:grid-cols-[1fr,120px,auto]">
        <input className="input-field" placeholder="Search documents..." value={query} onChange={(event) => setQuery(event.target.value)} />
        <input
          className="input-field"
          type="number"
          min="1"
          max="20"
          value={k}
          onChange={(event) => setK(Math.max(1, Math.min(20, Number(event.target.value) || 1)))}
        />
        <button className="btn-primary" type="submit" disabled={isSearching}>
          {isSearching ? 'Searching...' : 'Search'}
        </button>
      </form>

      <div className="surface-card p-4">
        <label htmlFor="min-similarity" className="text-sm font-medium">
          Min similarity: {(minSimilarity * 100).toFixed(0)}%
        </label>
        <input
          id="min-similarity"
          className="mt-2 w-full"
          type="range"
          min="0"
          max="1"
          step="0.01"
          value={minSimilarity}
          onChange={(event) => setMinSimilarity(Number(event.target.value))}
        />
      </div>

      {error && <p className="text-sm text-primary">{error}</p>}

      {!hasSearched ? (
        <p className="text-sm text-muted">Type a query and click Search.</p>
      ) : !filteredResults.length ? (
        <p className="text-sm text-muted">No results above the selected similarity threshold.</p>
      ) : (
        <div className="space-y-3">
          {filteredResults.map((result, index) => (
            <article key={`${result.document_id}-${result.chunk_index}-${index}`} className="surface-card p-4">
              <h3 className="font-semibold">{result.filename}</h3>
              <p className="mt-1 text-xs text-muted">
                Chunk #{result.chunk_index} • Score {(result.score * 100).toFixed(1)}%
              </p>
              <p className="mt-2 text-sm text-muted">{result.text}</p>
            </article>
          ))}
        </div>
      )}
    </div>
  )
}

function ChatTab({ projectId }) {
  const [question, setQuestion] = useState('')
  const [k, setK] = useState(5)
  const [history, setHistory] = useState([])
  const [isAsking, setIsAsking] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    const storageKey = `chat:${projectId}`
    const saved = localStorage.getItem(storageKey)

    setQuestion('')
    setK(5)
    setError('')

    if (!saved) {
      setHistory([])
      return
    }

    try {
      const parsed = JSON.parse(saved)
      setHistory(Array.isArray(parsed) ? parsed : [])
    } catch {
      setHistory([])
    }
  }, [projectId])

  useEffect(() => {
    const storageKey = `chat:${projectId}`
    localStorage.setItem(storageKey, JSON.stringify(history))
  }, [projectId, history])

  const latestSources = history[history.length - 1]?.sources || []

  const handleSend = async (event) => {
    event.preventDefault()
    if (!question.trim() || isAsking) return

    const userQuestion = question.trim()
    setQuestion('')
    setError('')
    setIsAsking(true)

    try {
      const response = await api.askProject(projectId, userQuestion, Number(k) || 5)
      setHistory((prev) => [
        ...prev,
        {
          question: userQuestion,
          answer: response?.answer || 'No answer returned.',
          sources: Array.isArray(response?.sources) ? response.sources : [],
        },
      ])
    } catch (askError) {
      if (askError.message !== 'Unauthorized') {
        setError(askError.message || 'Failed to get answer.')
      }
    } finally {
      setIsAsking(false)
    }
  }

  return (
    <div className="grid gap-4 lg:grid-cols-[2fr,1fr]">
      <div className="surface-card p-4">
        <div className="space-y-3">
          {!history.length ? (
            <p className="text-sm text-muted">Ask a question to start a chat for this project.</p>
          ) : (
            history.map((entry, index) => (
              <div key={`${entry.question}-${index}`} className="space-y-2">
                <div className="rounded-xl bg-accent/20 p-3 text-sm">{entry.question}</div>
                <div className="rounded-xl bg-primary/20 p-3 text-sm">{entry.answer}</div>
              </div>
            ))
          )}
        </div>

        {error && <p className="mt-3 text-sm text-primary">{error}</p>}

        <form className="mt-4 grid gap-2 md:grid-cols-[1fr,100px,auto]" onSubmit={handleSend}>
          <input className="input-field" placeholder="Ask a question..." value={question} onChange={(event) => setQuestion(event.target.value)} />
          <input
            className="input-field"
            type="number"
            min="1"
            max="20"
            value={k}
            onChange={(event) => setK(Math.max(1, Math.min(20, Number(event.target.value) || 1)))}
          />
          <button className="btn-primary" type="submit" disabled={isAsking}>
            {isAsking ? 'Sending...' : 'Send'}
          </button>
        </form>
      </div>

      <aside className="surface-card p-4">
        <h3 className="text-sm font-semibold uppercase tracking-wide text-muted">Citations</h3>
        {!latestSources.length ? (
          <p className="mt-3 text-sm text-muted">No citations yet.</p>
        ) : (
          <ul className="mt-3 space-y-2 text-sm">
            {latestSources.map((source, index) => (
              <li key={`${source.filename}-${source.chunk_index}-${index}`} className="rounded-lg bg-accent/20 p-2">
                {source.filename}, chunk #{source.chunk_index} ({(source.score * 100).toFixed(1)}%)
              </li>
            ))}
          </ul>
        )}
      </aside>
    </div>
  )
}

function NotesTab({ projectId }) {
  const storageKey = `notes:${projectId}`
  const [notes, setNotes] = useState('')

  useEffect(() => {
    setNotes(localStorage.getItem(storageKey) || '')
  }, [storageKey])

  const handleChange = (event) => {
    const value = event.target.value
    setNotes(value)
    localStorage.setItem(storageKey, value)
  }

  return (
    <div className="surface-card p-4">
      <p className="text-sm text-muted">Capture key insights, hypotheses, and next actions for your project.</p>
      <textarea className="input-field mt-3 min-h-40" placeholder="Write project notes..." value={notes} onChange={handleChange} />
    </div>
  )
}

export default function ProjectPage() {
  const { projectId = '' } = useParams()
  const { projects = [] } = useOutletContext() || {}
  const [activeTab, setActiveTab] = useState(tabs[0])

  const [project, setProject] = useState(null)
  const [isLoadingProject, setIsLoadingProject] = useState(true)
  const [projectError, setProjectError] = useState('')

  useEffect(() => {
    setActiveTab(tabs[0])
  }, [projectId])

  useEffect(() => {
    if (!projectId) {
      setProject(null)
      setIsLoadingProject(false)
      return
    }

    const numericId = Number(projectId)
    if (!Number.isFinite(numericId)) {
      setProjectError('Invalid project id.')
      setIsLoadingProject(false)
      return
    }

    setIsLoadingProject(true)
    setProjectError('')

    const inSidebarList = projects.find((item) => item.id === numericId)
    if (inSidebarList) {
      setProject(inSidebarList)
      setIsLoadingProject(false)
      return
    }

    api
      .getProjects()
      .then((data) => {
        const found = Array.isArray(data) ? data.find((item) => item.id === numericId) : null
        if (!found) {
          setProject(null)
          setProjectError('Project not found.')
          return
        }

        setProject(found)
      })
      .catch((error) => {
        if (error.message !== 'Unauthorized') {
          setProjectError(error.message || 'Failed to load project details.')
        }
      })
      .finally(() => {
        setIsLoadingProject(false)
      })
  }, [projectId, projects])

  return (
    <section className="space-y-6">
      <header className="surface-card p-6">
        <p className="text-xs font-semibold uppercase tracking-wide text-muted">Project</p>
        <h1 className="mt-2 text-3xl font-bold">{isLoadingProject ? 'Loading...' : project?.name || 'Unknown Project'}</h1>
        <p className="mt-2 text-sm text-muted">{project?.description || 'Project details from backend.'}</p>
        {projectError && <p className="mt-2 text-sm text-primary">{projectError}</p>}
      </header>

      <div className="surface-card p-3">
        <div className="flex flex-wrap gap-2">
          {tabs.map((tab) => (
            <button
              key={tab}
              type="button"
              onClick={() => setActiveTab(tab)}
              className={`rounded-xl px-4 py-2 text-sm font-medium transition ${
                activeTab === tab ? 'bg-primary text-primary-foreground shadow-sm' : 'text-muted hover:bg-accent/30 hover:text-text'
              }`}
            >
              {tab}
            </button>
          ))}
        </div>
      </div>

      {activeTab === 'Documents' && <DocumentsTab projectId={projectId} />}
      {activeTab === 'Search' && <SearchTab projectId={projectId} />}
      {activeTab === 'Chat' && <ChatTab projectId={projectId} />}
      {activeTab === 'Notes' && <NotesTab projectId={projectId} />}
    </section>
  )
}
