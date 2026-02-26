import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'

export default function SignupPage() {
  const navigate = useNavigate()
  const [error, setError] = useState('')

  const handleSubmit = (event) => {
    event.preventDefault()
    const formData = new FormData(event.currentTarget)
    const fullName = String(formData.get('fullName') || '').trim()
    const email = String(formData.get('email') || '').trim()
    const password = String(formData.get('password') || '')

    if (fullName.length < 2) {
      setError('Please enter your full name.')
      return
    }

    if (!email.includes('@')) {
      setError('Please provide a valid email address.')
      return
    }

    if (password.length < 8) {
      setError('Password must be at least 8 characters.')
      return
    }

    setError('')
    localStorage.setItem('token', 'demo-token')
    navigate('/dashboard')
  }

  return (
    <section className="mx-auto flex min-h-[calc(100vh-4rem)] max-w-7xl items-center justify-center px-4 py-12 sm:px-6">
      <div className="surface-card w-full max-w-md p-8">
        <h1 className="text-3xl font-bold">Create your account</h1>
        <p className="mt-2 text-sm text-slate-600 dark:text-slate-300">Start building a structured research workspace.</p>

        {error && (
          <div className="mt-5 rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700 dark:border-rose-900/80 dark:bg-rose-950/40 dark:text-rose-200">
            {error}
          </div>
        )}

        <form className="mt-5 space-y-4" onSubmit={handleSubmit}>
          <div>
            <label htmlFor="fullName" className="mb-1.5 block text-sm font-medium">
              Full name
            </label>
            <input id="fullName" name="fullName" className="input-field" placeholder="Taylor Smith" required />
          </div>

          <div>
            <label htmlFor="email" className="mb-1.5 block text-sm font-medium">
              Email
            </label>
            <input id="email" name="email" className="input-field" placeholder="you@company.com" type="email" required />
          </div>

          <div>
            <label htmlFor="password" className="mb-1.5 block text-sm font-medium">
              Password
            </label>
            <input id="password" name="password" className="input-field" placeholder="Create a secure password" type="password" required />
            <p className="mt-1 text-xs text-slate-500">At least 8 characters.</p>
          </div>

          <button className="w-full rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-blue-700" type="submit">
            Sign up
          </button>
        </form>

        <p className="mt-5 text-sm text-slate-600 dark:text-slate-300">
          Already registered?{' '}
          <Link to="/login" className="font-semibold text-blue-600 dark:text-blue-400">
            Log in
          </Link>
        </p>
      </div>
    </section>
  )
}
