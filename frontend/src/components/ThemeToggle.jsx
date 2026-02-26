import { useTheme } from '../context/ThemeContext'

export default function ThemeToggle() {
  const { theme, toggleTheme } = useTheme()
  const isDark = theme === 'dark'

  return (
    <button
      type="button"
      onClick={toggleTheme}
      className="inline-flex items-center gap-2 rounded-lg border border-slate-300 px-3 py-2 text-sm font-medium hover:bg-slate-100 dark:border-slate-700 dark:hover:bg-slate-800"
      aria-label="Toggle theme"
    >
      <span>{isDark ? '☀️' : '🌙'}</span>
      <span>{isDark ? 'Day' : 'Night'}</span>
    </button>
  )
}
