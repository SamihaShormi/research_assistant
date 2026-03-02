import { useEffect, useMemo, useRef, useState } from 'react'
import { useOutletContext } from 'react-router-dom'
import { api } from '../../lib/api'

function sourceStorageKey(projectId) {
  return `project_sources:${projectId}`
}

export default function ProjectSourcesTab() {
  const { projectId } = useOutletContext()
  const textFormRef = useRef(null)
  const pdfFormRef = useRef(null)
  const [sources, setSources] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const [textError, setTextError] = useState('')
  const [pdfError, setPdfError] = useState('')
  const [statusMessage, setStatusMessage] = useState('')
  const [isUploadingText, setIsUploadingText] = useState(false)
  const [isUploadingPdf, setIsUploadingPdf] = useState(false)
  const [deletingId, setDeletingId] = useState(null)

  useEffect(() => {
    setIsLoading(true)
    const cached = localStorage.getItem(sourceStorageKey(projectId))
    if (cached) {
      try {
        const parsed = JSON.parse(cached)
        setSources(Array.isArray(parsed) ? parsed : [])
      } catch {
        setSources([])
      }
    } else {
      setSources([])
    }
    setTextError('')
    setPdfError('')
    setStatusMessage('')
    setIsLoading(false)
  }, [projectId])

  const sortedSources = useMemo(
    () => [...sources].sort((a, b) => new Date(b.uploadedAt || 0).getTime() - new Date(a.uploadedAt || 0).getTime()),
    [sources]
  )

  const persistSources = (nextSources) => {
    setSources(nextSources)
    localStorage.setItem(sourceStorageKey(projectId), JSON.stringify(nextSources))
  }

  const persistSource = (entry) => {
    setSources((prev) => {
      const next = [entry, ...prev]
      localStorage.setItem(sourceStorageKey(projectId), JSON.stringify(next))
      return next
    })
  }

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
    setStatusMessage('')
    setIsUploadingText(true)
    try {
      const response = await api.uploadTextDocument(projectId, { filename, content })
      const chunksCreated = Number(response?.chunks_created ?? 0)
      persistSource({
        document_id: response?.document_id ?? null,
        filename,
        chunks_created: chunksCreated,
        status: chunksCreated > 0 ? 'Indexed' : 'Warning',
        uploadedAt: new Date().toISOString(),
      })
      setStatusMessage(
        chunksCreated === 0
          ? 'No chunks created. This can happen if extraction returned empty text or chunking produced no output.'
          : `${filename} uploaded successfully. Chunks created: ${chunksCreated}.`
      )
      textFormRef.current?.reset()
    } catch (error) {
      if (error.message !== 'Unauthorized') {
        setTextError(error.message || 'Failed to upload text source.')
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
      setPdfError('Please select a PDF file.')
      return
    }

    setPdfError('')
    setStatusMessage('')
    setIsUploadingPdf(true)
    try {
      const response = await api.uploadPdfDocument(projectId, file)
      const chunksCreated = Number(response?.chunks_created ?? 0)
      persistSource({
        document_id: response?.document_id ?? null,
        filename: file.name,
        chunks_created: chunksCreated,
        status: chunksCreated > 0 ? 'Indexed' : 'Warning',
        uploadedAt: new Date().toISOString(),
      })
      setStatusMessage(
        chunksCreated === 0
          ? 'No chunks created. This can happen if extraction returned empty text or chunking produced no output.'
          : `${file.name} uploaded successfully. Chunks created: ${chunksCreated}.`
      )
      pdfFormRef.current?.reset()
    } catch (error) {
      if (error.message !== 'Unauthorized') {
        setPdfError(error.message || 'Failed to upload PDF source.')
      }
    } finally {
      setIsUploadingPdf(false)
    }
  }

  const handleDeleteSource = async (source) => {
    if (!source?.document_id || deletingId) return

    const shouldDelete = window.confirm(`Delete source "${source.filename}"?`)
    if (!shouldDelete) return

    setStatusMessage('')
    setDeletingId(source.document_id)
    try {
      await api.deleteProjectDocument(projectId, source.document_id)
      const next = sources.filter((item) => item.document_id !== source.document_id)
      persistSources(next)
      setStatusMessage(`Deleted source: ${source.filename}.`)
    } catch (error) {
      if (error.message !== 'Unauthorized') {
        setStatusMessage(error.message || 'Failed to delete source.')
      }
    } finally {
      setDeletingId(null)
    }
  }

  return (
    <div className="space-y-4">
      <div className="grid gap-4 lg:grid-cols-2">
        <form ref={pdfFormRef} className="surface-card space-y-3 p-4" onSubmit={handlePdfUpload}>
          <h3 className="font-semibold">Upload PDF</h3>
          <input name="file" type="file" accept="application/pdf,.pdf" className="input-field" required />
          {pdfError && <p className="text-xs text-primary">{pdfError}</p>}
          <button type="submit" className="btn-primary" disabled={isUploadingPdf}>{isUploadingPdf ? 'Uploading...' : 'Upload PDF'}</button>
        </form>

        <form ref={textFormRef} className="surface-card space-y-3 p-4" onSubmit={handleTextUpload}>
          <h3 className="font-semibold">Upload Text</h3>
          <input name="filename" className="input-field" placeholder="notes.txt" required />
          <textarea name="content" className="input-field min-h-28" placeholder="Paste source text..." required />
          {textError && <p className="text-xs text-primary">{textError}</p>}
          <button type="submit" className="btn-primary" disabled={isUploadingText}>{isUploadingText ? 'Uploading...' : 'Upload Text'}</button>
        </form>
      </div>

      {statusMessage && <p className="rounded-xl border border-border bg-accent/15 px-3 py-2 text-sm">{statusMessage}</p>}

      <div className="surface-card p-4">
        <h3 className="text-lg font-semibold">Sources</h3>
        {isLoading ? (
          <div className="mt-3 space-y-2">
            <div className="h-14 animate-pulse rounded-xl bg-accent/30" />
            <div className="h-14 animate-pulse rounded-xl bg-accent/30" />
          </div>
        ) : !sortedSources.length ? (
          <p className="mt-3 text-sm text-muted">Upload PDFs or text notes to start indexing.</p>
        ) : (
          <div className="mt-3 space-y-2">
            {sortedSources.map((item, index) => (
              <article key={`${item.document_id ?? 'unknown'}-${item.filename}-${item.uploadedAt}-${index}`} className="rounded-xl border border-border bg-bg p-3 text-sm">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div>
                    <p className="font-medium">{item.filename}</p>
                    <p className="mt-0.5 text-xs text-muted">Document ID: {item.document_id ?? 'Unknown'}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="rounded-full bg-accent/25 px-2 py-0.5 text-xs">{item.status}</span>
                    <button
                      type="button"
                      onClick={() => handleDeleteSource(item)}
                      disabled={!item.document_id || deletingId === item.document_id}
                      className="rounded-lg border border-border bg-accent/20 px-2 py-1 text-xs font-medium text-text transition hover:bg-accent/30 disabled:cursor-not-allowed disabled:opacity-60"
                    >
                      {deletingId === item.document_id ? 'Deleting...' : 'Delete'}
                    </button>
                  </div>
                </div>
                <p className="mt-1 text-xs text-muted">Chunks: {item.chunks_created} • Uploaded {new Date(item.uploadedAt).toLocaleString()}</p>
              </article>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
