import { useMemo, useState } from 'react'
import { useParams } from 'react-router-dom'

const tabs = ['Documents', 'Search', 'Chat', 'Notes']

export default function ProjectPage() {
  const { projectId } = useParams()
  const [activeTab, setActiveTab] = useState(tabs[0])

  const title = useMemo(() => `Project ${projectId}`, [projectId])

  return (
    <section className="space-y-5 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900">
      <div>
        <h1 className="text-2xl font-bold">{title}</h1>
        <p className="text-slate-600 dark:text-slate-300">Protected project workspace placeholder.</p>
      </div>

      <div className="flex flex-wrap gap-2 border-b border-slate-200 pb-3 dark:border-slate-800">
        {tabs.map((tab) => (
          <button
            key={tab}
            type="button"
            onClick={() => setActiveTab(tab)}
            className={`rounded-lg px-4 py-2 text-sm font-medium ${
              activeTab === tab
                ? 'bg-blue-600 text-white'
                : 'bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700'
            }`}
          >
            {tab}
          </button>
        ))}
      </div>

      <div className="rounded-xl border border-dashed border-slate-300 p-6 text-slate-600 dark:border-slate-700 dark:text-slate-300">
        {activeTab} panel placeholder content.
      </div>
    </section>
  )
}
