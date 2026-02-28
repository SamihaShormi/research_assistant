import { useMemo, useState } from 'react'
import { useParams } from 'react-router-dom'

const tabs = ['Documents', 'Search', 'Chat', 'Notes']

const documents = [
  { name: 'Industry-Report.pdf', status: 'Indexed', pages: 28 },
  { name: 'Interview-Transcript.docx', status: 'Processing', pages: 14 },
]

const searchResults = [
  {
    title: 'Emerging B2B SaaS Benchmarks in 2025',
    summary: 'Benchmarks suggest higher retention for products with built-in AI research assistants.',
    citation: 'SaaS Benchmarks Report, p. 12',
  },
  {
    title: 'Research Team Productivity Analysis',
    summary: 'Centralized document repositories reduced duplicate effort by 23% in surveyed teams.',
    citation: 'Ops Study, Section 4.1',
  },
]

const projectCatalog = {
  demo: {
    name: 'Market Trends 2026',
    description: 'Research workspace for market reports, interview notes, and trend analysis.',
  },
  alpha: {
    name: 'AI Adoption Research',
    description: 'Analyze adoption patterns, blockers, and opportunities across customer segments.',
  },
}

function formatProjectId(projectId) {
  return String(projectId || '')
    .split(/[-_\s]+/)
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ')
}

function DocumentsTab() {
  if (!documents.length) {
    return (
      <div className="rounded-xl border border-dashed border-slate-300 p-8 text-center dark:border-slate-700">
        <p className="font-medium">No documents uploaded</p>
        <p className="mt-1 text-sm text-slate-500">Upload your first source file to start indexing.</p>
      </div>
    )
  }

  return (
    <div className="space-y-3">
      {documents.map((doc) => (
        <article key={doc.name} className="surface-card p-4">
          <div className="flex items-start justify-between gap-3">
            <div>
              <h3 className="font-medium">{doc.name}</h3>
              <p className="text-xs text-slate-500">{doc.pages} pages</p>
            </div>
            <span
              className={`rounded-full px-3 py-1 text-xs font-semibold ${
                doc.status === 'Indexed'
                  ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300'
                  : 'bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300'
              }`}
            >
              {doc.status}
            </span>
          </div>
        </article>
      ))}
    </div>
  )
}

function SearchTab() {
  return (
    <div className="space-y-3">
      {searchResults.map((result) => (
        <article key={result.title} className="surface-card p-4">
          <h3 className="font-semibold">{result.title}</h3>
          <p className="mt-1 text-sm text-slate-600 dark:text-slate-300">{result.summary}</p>
          <p className="mt-3 rounded-lg bg-slate-100 px-3 py-2 text-xs text-slate-600 dark:bg-slate-800 dark:text-slate-300">
            Citation: {result.citation}
          </p>
        </article>
      ))}
    </div>
  )
}

function ChatTab() {
  return (
    <div className="grid gap-4 lg:grid-cols-[2fr,1fr]">
      <div className="surface-card p-4">
        <div className="space-y-3">
          <div className="rounded-xl bg-slate-100 p-3 text-sm dark:bg-slate-800">
            What are the top recurring themes in customer interviews?
          </div>
          <div className="rounded-xl bg-blue-600/10 p-3 text-sm">
            Three themes emerged: onboarding friction, limited reporting flexibility, and citation trust needs.
          </div>
        </div>
        <div className="mt-4 flex gap-2">
          <input className="input-field" placeholder="Ask a follow-up question..." />
          <button className="rounded-xl bg-blue-600 px-4 text-sm font-semibold text-white">Send</button>
        </div>
      </div>
      <aside className="surface-card p-4">
        <h3 className="text-sm font-semibold uppercase tracking-wide text-slate-500">Citations</h3>
        <ul className="mt-3 space-y-2 text-sm">
          <li className="rounded-lg bg-slate-100 p-2 dark:bg-slate-800">Interview-Transcript.docx, page 3</li>
          <li className="rounded-lg bg-slate-100 p-2 dark:bg-slate-800">Ops Study, section 4.1</li>
        </ul>
      </aside>
    </div>
  )
}

function NotesTab() {
  return (
    <div className="surface-card p-4">
      <p className="text-sm text-slate-600 dark:text-slate-300">
        Capture key insights, hypotheses, and next actions for your project.
      </p>
      <textarea className="input-field mt-3 min-h-40" placeholder="Write project notes..." />
    </div>
  )
}

export default function ProjectPage() {
  const { projectId = '' } = useParams()
  const [activeTab, setActiveTab] = useState(tabs[0])

  const project = useMemo(() => {
    const known = projectCatalog[projectId]
    if (known) return known
    return {
      name: formatProjectId(projectId) || 'Untitled Project',
      description: 'Project details will appear here once your project metadata is available.',
    }
  }, [projectId])

  return (
    <section className="space-y-6">
      <header className="surface-card p-6">
        <p className="text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">Project</p>
        <h1 className="mt-2 text-3xl font-bold">{project.name}</h1>
        <p className="mt-2 text-sm text-slate-600 dark:text-slate-300">{project.description}</p>
      </header>

      <div className="surface-card p-3">
        <div className="flex flex-wrap gap-2">
          {tabs.map((tab) => (
            <button
              key={tab}
              type="button"
              onClick={() => setActiveTab(tab)}
              className={`rounded-xl px-4 py-2 text-sm font-medium transition ${
                activeTab === tab
                  ? 'bg-blue-600 text-white shadow-sm'
                  : 'text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800'
              }`}
            >
              {tab}
            </button>
          ))}
        </div>
      </div>

      {activeTab === 'Documents' && <DocumentsTab />}
      {activeTab === 'Search' && <SearchTab />}
      {activeTab === 'Chat' && <ChatTab />}
      {activeTab === 'Notes' && <NotesTab />}
    </section>
  )
}