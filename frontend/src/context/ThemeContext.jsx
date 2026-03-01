import { createContext, useContext, useEffect, useMemo, useState } from 'react'

const ThemeContext = createContext(null)

const getSystemTheme = () =>
  window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'

const getInitialTheme = () => {
  const storedTheme = localStorage.getItem('theme')
  if (storedTheme === 'light' || storedTheme === 'dark') {
    return { theme: storedTheme, source: 'stored' }
  }

  return { theme: getSystemTheme(), source: 'system' }
}

const applyThemeClass = (theme) => {
  document.documentElement.classList.toggle('dark', theme === 'dark')
}

export function ThemeProvider({ children }) {
  const [{ theme, source }, setThemeState] = useState(getInitialTheme)

  useEffect(() => {
    applyThemeClass(theme)
    if (source === 'stored') {
      localStorage.setItem('theme', theme)
    }
  }, [source, theme])

  useEffect(() => {
    if (source === 'stored') return undefined

    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)')
    const handleChange = (event) => {
      setThemeState({ theme: event.matches ? 'dark' : 'light', source: 'system' })
    }

    mediaQuery.addEventListener('change', handleChange)
    return () => mediaQuery.removeEventListener('change', handleChange)
  }, [source])

  const value = useMemo(
    () => ({
      theme,
      toggleTheme: () => {
        setThemeState((current) => {
          const nextTheme = current.theme === 'dark' ? 'light' : 'dark'
          return { theme: nextTheme, source: 'stored' }
        })
      },
    }),
    [theme],
  )

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>
}

export function useTheme() {
  const context = useContext(ThemeContext)
  if (!context) {
    throw new Error('useTheme must be used inside ThemeProvider')
  }
  return context
}
