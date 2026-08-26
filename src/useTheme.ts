import { useCallback, useEffect, useState } from 'react'

export type Theme = 'light' | 'dark'

const THEME_STORAGE_KEY = 'trip-planner-theme'
const DARK_QUERY = '(prefers-color-scheme: dark)'

const readStoredTheme = (): Theme | null => {
  if (typeof window === 'undefined') return null

  try {
    const stored = window.localStorage.getItem(THEME_STORAGE_KEY)
    return stored === 'light' || stored === 'dark' ? stored : null
  } catch {
    return null
  }
}

const getSystemTheme = (): Theme =>
  typeof window !== 'undefined' && window.matchMedia(DARK_QUERY).matches ? 'dark' : 'light'

const getInitialTheme = (): Theme => readStoredTheme() ?? getSystemTheme()

/**
 * Resolves the active theme and mirrors it onto <html data-theme> so the CSS
 * variables in index.css switch. Without a stored choice the system preference
 * wins and keeps winning as it changes; toggling pins the choice.
 */
export function useTheme() {
  const [theme, setTheme] = useState<Theme>(getInitialTheme)

  useEffect(() => {
    document.documentElement.dataset.theme = theme
  }, [theme])

  useEffect(() => {
    if (readStoredTheme()) return

    const mediaQuery = window.matchMedia(DARK_QUERY)
    const handleChange = (event: MediaQueryListEvent) => {
      setTheme(event.matches ? 'dark' : 'light')
    }

    mediaQuery.addEventListener('change', handleChange)
    return () => mediaQuery.removeEventListener('change', handleChange)
  }, [theme])

  const toggleTheme = useCallback(() => {
    setTheme(prev => {
      const next = prev === 'dark' ? 'light' : 'dark'
      try {
        window.localStorage.setItem(THEME_STORAGE_KEY, next)
      } catch {
        // Preference just won't persist across reloads.
      }
      return next
    })
  }, [])

  return { theme, toggleTheme }
}
