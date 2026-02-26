import { Link, Outlet, useLocation } from 'react-router-dom'
import Navbar from '../components/Navbar'

const navItems = [
  { to: '/dashboard', label: 'Dashboard' },
  { to: '/projects/demo', label: 'Sample Project' },
]

export default function AppShell() {
  const location = useLocation()

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 dark:bg-slate-950 dark:text-slate-100">
      <Navbar />
      <div className="mx-auto flex max-w-7xl gap-6 px-4 py-6">
        <aside className="hidden w-64 shrink-0 rounded-xl border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900 md:block">
          <p className="mb-3 text-xs font-semibold uppercase tracking-wide text-slate-500">Workspace</p>
          <nav className="space-y-2">
            {navItems.map((item) => {
              const active = location.pathname.startsWith(item.to)
              return (
                <Link
                  key={item.to}
                  to={item.to}
                  className={`block rounded-lg px-3 py-2 text-sm font-medium ${
                    active
                      ? 'bg-blue-600 text-white'
                      : 'hover:bg-slate-100 dark:hover:bg-slate-800'
                  }`}
                >
                  {item.label}
                </Link>
              )
            })}
          </nav>
        </aside>
        <main className="w-full">
          <Outlet />
        </main>
      </div>
    </div>
  )
}
