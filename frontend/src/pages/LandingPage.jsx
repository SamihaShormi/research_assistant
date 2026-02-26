import { Link } from 'react-router-dom'

const features = [
  {
    title: 'Research hub',
    text: 'Organize documents, notes, and conversations in one place with clear project structure.',
  },
  {
    title: 'Smarter discovery',
    text: 'Run targeted searches and keep source citations attached to every generated insight.',
  },
  {
    title: 'Team-ready output',
    text: 'Turn findings into polished summaries with context retained from chat and notes.',
  },
]

export default function LandingPage() {
  return (
    <section className="mx-auto max-w-7xl space-y-8 px-4 py-12 sm:px-6 sm:py-16">
      <div className="surface-card overflow-hidden p-8 sm:p-12">
        <p className="mb-4 inline-flex rounded-full bg-blue-50 px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] text-blue-700 dark:bg-blue-950/60 dark:text-blue-300">
          Modern AI research workflow
        </p>
        <h1 className="max-w-3xl text-4xl font-bold leading-tight sm:text-5xl">Organize findings, search faster, and write with confidence.</h1>
        <p className="mt-4 max-w-2xl text-base text-slate-600 dark:text-slate-300 sm:text-lg">
          Research Assistant gives your team a beautiful workspace to collect documents, run deep search, and maintain source-backed conversations.
        </p>
        <div className="mt-8 flex flex-wrap gap-3">
          <Link to="/signup" className="rounded-xl bg-blue-600 px-5 py-3 text-sm font-semibold text-white transition hover:bg-blue-700">
            Get started free
          </Link>
          <Link
            to="/login"
            className="rounded-xl border border-slate-300 px-5 py-3 text-sm font-semibold transition hover:bg-slate-100 dark:border-slate-700 dark:hover:bg-slate-800"
          >
            Log in to your workspace
          </Link>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        {features.map((feature) => (
          <article key={feature.title} className="surface-card p-6">
            <h2 className="text-lg font-semibold">{feature.title}</h2>
            <p className="mt-2 text-sm text-slate-600 dark:text-slate-300">{feature.text}</p>
          </article>
        ))}
      </div>
    </section>
  )
}
