import { Link } from 'react-router-dom'

export default function LandingPage() {
  return (
    <section className="mx-auto max-w-7xl px-4 py-16">
      <div className="rounded-2xl border border-slate-200 bg-white p-10 shadow-sm dark:border-slate-800 dark:bg-slate-900">
        <p className="mb-3 text-sm font-semibold uppercase tracking-widest text-blue-600 dark:text-blue-400">
          AI-powered research workflow
        </p>
        <h1 className="mb-4 text-4xl font-bold sm:text-5xl">Organize findings, search faster, write with confidence.</h1>
        <p className="mb-8 max-w-2xl text-lg text-slate-600 dark:text-slate-300">
          Research Assistant helps teams collect sources, ask better questions, and keep project notes in one focused workspace.
        </p>
        <div className="flex flex-wrap gap-3">
          <Link to="/signup" className="rounded-lg bg-blue-600 px-5 py-3 font-semibold text-white hover:bg-blue-700">
            Get started
          </Link>
          <Link
            to="/login"
            className="rounded-lg border border-slate-300 px-5 py-3 font-semibold hover:bg-slate-100 dark:border-slate-700 dark:hover:bg-slate-800"
          >
            Log in
          </Link>
        </div>
      </div>
    </section>
  )
}
