import { Link, useLocation } from 'react-router-dom'
import ThemeToggle from './ThemeToggle'

export default function Navbar() {
  const location = useLocation()
  const isAuthenticated = Boolean(localStorage.getItem('token'))

  const isPublic = ['/', '/login', '/signup'].includes(location.pathname)

  return (
    <header className="sticky top-0 z-40 border-b border-slate-200/90 bg-white/90 backdrop-blur dark:border-slate-800 dark:bg-slate-950/80">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3 sm:px-6">
        <Link to={isAuthenticated ? '/dashboard' : '/'} className="flex items-center gap-2">
          <span className="inline-flex h-9 w-9 items-center justify-center rounded-xl bg-blue-600 text-sm font-bold text-white shadow-sm">RA</span>
          <span className="text-sm font-semibold sm:text-base">Research Assistant</span>
        </Link>

        <div className="flex items-center gap-2">
          {isPublic && !isAuthenticated ? (
            <>
              <Link
                to="/login"
                className="rounded-xl px-3 py-2 text-sm font-medium text-slate-600 transition hover:bg-slate-100 hover:text-slate-900 dark:text-slate-300 dark:hover:bg-slate-800"
              >
                Login
              </Link>
              <Link
                to="/signup"
                className="rounded-xl bg-blue-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-blue-700"
              >
                Sign up
              </Link>
            </>
          ) : (
            <Link
              to="/dashboard"
              className="hidden rounded-xl px-3 py-2 text-sm font-medium text-slate-600 transition hover:bg-slate-100 hover:text-slate-900 dark:text-slate-300 dark:hover:bg-slate-800 sm:block"
            >
              Dashboard
            </Link>
          )}
          <ThemeToggle />
        </div>
      </div>
    </header>
  )
}
