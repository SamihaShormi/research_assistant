import { Link, useLocation } from 'react-router-dom'
import ThemeToggle from './ThemeToggle'

export default function Navbar() {
  const location = useLocation()
  const isAuthenticated = Boolean(localStorage.getItem('token'))

  const isPublic = ['/', '/login', '/signup'].includes(location.pathname)

  return (
    <header className="sticky top-0 z-40 border-b border-border/90 bg-bg/90 backdrop-blur">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3 sm:px-6">
        <Link to={isAuthenticated ? '/dashboard' : '/'} className="flex items-center gap-2">
          <span className="inline-flex h-9 w-9 items-center justify-center rounded-xl bg-primary text-sm font-bold text-primary-foreground shadow-sm">
            RA
          </span>
          <span className="text-sm font-semibold sm:text-base">Research Assistant</span>
        </Link>

        <div className="flex items-center gap-2">
          {isPublic && !isAuthenticated ? (
            <>
              <Link
                to="/login"
                className="rounded-xl px-3 py-2 text-sm font-medium text-muted transition hover:bg-accent/30 hover:text-text"
              >
                Login
              </Link>
              <Link
                to="/signup"
                className="rounded-xl bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground transition hover:opacity-90"
              >
                Sign up
              </Link>
            </>
          ) : (
            <Link
              to="/dashboard"
              className="hidden rounded-xl px-3 py-2 text-sm font-medium text-muted transition hover:bg-accent/30 hover:text-text sm:block"
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
