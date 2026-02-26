import { Link, useNavigate } from 'react-router-dom'

export default function SignupPage() {
  const navigate = useNavigate()

  const handleSubmit = (event) => {
    event.preventDefault()
    localStorage.setItem('token', 'demo-token')
    navigate('/dashboard')
  }

  return (
    <section className="mx-auto max-w-md px-4 py-12">
      <div className="rounded-2xl border border-slate-200 bg-white p-8 shadow-sm dark:border-slate-800 dark:bg-slate-900">
        <h1 className="mb-2 text-3xl font-bold">Create your account</h1>
        <p className="mb-6 text-slate-600 dark:text-slate-300">Start building a structured research workspace.</p>
        <form className="space-y-4" onSubmit={handleSubmit}>
          <input className="w-full rounded-lg border border-slate-300 bg-transparent px-3 py-2 dark:border-slate-700" placeholder="Full name" required />
          <input className="w-full rounded-lg border border-slate-300 bg-transparent px-3 py-2 dark:border-slate-700" placeholder="Email" type="email" required />
          <input className="w-full rounded-lg border border-slate-300 bg-transparent px-3 py-2 dark:border-slate-700" placeholder="Password" type="password" required />
          <button className="w-full rounded-lg bg-blue-600 px-4 py-2 font-semibold text-white hover:bg-blue-700" type="submit">
            Sign up
          </button>
        </form>
        <p className="mt-4 text-sm text-slate-600 dark:text-slate-300">
          Already registered?{' '}
          <Link to="/login" className="font-semibold text-blue-600 dark:text-blue-400">
            Log in
          </Link>
        </p>
      </div>
    </section>
  )
}
