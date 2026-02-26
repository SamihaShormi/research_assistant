import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'

export default function LoginPage() {
  const navigate = useNavigate()
  const [error, setError] = useState('')

  const handleSubmit = (event) => {
    event.preventDefault()
    const formData = new FormData(event.currentTarget)
    const email = String(formData.get('email') || '').trim()
    const password = String(formData.get('password') || '')

    if (!email.includes('@')) {
      setError('Please provide a valid email address.')
      return
    }

    if (password.length < 6) {
      setError('Password must be at least 6 characters.')
      return
    }

    setError('')
    localStorage.setItem('token', 'demo-token')
    navigate('/dashboard')
  }

  return (
    <section className="mx-auto flex min-h-[calc(100vh-4rem)] max-w-7xl items-center justify-center px-4 py-12 sm:px-6">
      <div className="surface-card w-full max-w-md p-8">
        <h1 className="text-3xl font-bold">Welcome back</h1>
        <p className="mt-2 text-sm text-slate-600 dark:text-slate-300">Sign in to continue your research projects.</p>

        {error && (
          <div className="mt-5 rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700 dark:border-rose-900/80 dark:bg-rose-950/40 dark:text-rose-200">
            {error}
          </div>
        )}

        <form className="mt-5 space-y-4" onSubmit={handleSubmit}>
          <div>
            <label htmlFor="email" className="mb-1.5 block text-sm font-medium">
              Email
            </label>
            <input id="email" name="email" className="input-field" placeholder="you@company.com" type="email" required />
            <p className="mt-1 text-xs text-slate-500">Use the email associated with your workspace.</p>
          </div>

          <div>
            <label htmlFor="password" className="mb-1.5 block text-sm font-medium">
              Password
            </label>
            <input id="password" name="password" className="input-field" placeholder="••••••••" type="password" required />
            <p className="mt-1 text-xs text-slate-500">Must be at least 6 characters.</p>
          </div>

          <button className="w-full rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-blue-700" type="submit">
            Login
          </button>
        </form>

        <p className="mt-5 text-sm text-slate-600 dark:text-slate-300">
          Need an account?{' '}
          <Link to="/signup" className="font-semibold text-blue-600 dark:text-blue-400">
            Create one
          </Link>
        </p>
      </div>
    </section>
  )
}
