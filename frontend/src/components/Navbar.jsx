import { Link } from 'react-router-dom'
import ThemeToggle from './ThemeToggle'

export default function Navbar() {
  return (
    <header className="sticky top-0 z-40 border-b border-slate-200 bg-white/90 backdrop-blur dark:border-slate-800 dark:bg-slate-900/90">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3">
        <Link to="/" className="text-lg font-bold text-blue-600 dark:text-blue-400">
          Research Assistant
        </Link>
        <div className="flex items-center gap-3">
          <Link
            to="/login"
            className="rounded-lg px-3 py-2 text-sm font-medium hover:bg-slate-100 dark:hover:bg-slate-800"
          >
            Login
          </Link>
          <Link
            to="/signup"
            className="rounded-lg bg-blue-600 px-3 py-2 text-sm font-medium text-white hover:bg-blue-700"
          >
            Sign up
          </Link>
          <ThemeToggle />
        </div>
      </div>
    </header>
  )
}
