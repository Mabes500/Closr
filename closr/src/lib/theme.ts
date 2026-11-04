// Appearance (roadmap 7.1): Light (default), Dark or Match device. Kept in localStorage so
// index.html can apply it before first paint, and on the profile so it follows the account.

export type Theme = 'light' | 'dark' | 'system'

const KEY = 'closr-theme'
const device = () => window.matchMedia('(prefers-color-scheme: dark)')

export function storedTheme(): Theme {
  try {
    const t = localStorage.getItem(KEY)
    return t === 'dark' || t === 'system' ? t : 'light'
  } catch {
    return 'light'
  }
}

export const effectiveTheme = (t: Theme): 'light' | 'dark' => (t === 'system' ? (device().matches ? 'dark' : 'light') : t)

const paint = (t: Theme) => {
  document.documentElement.dataset.theme = effectiveTheme(t)
}

export function applyTheme(t: Theme) {
  try {
    localStorage.setItem(KEY, t)
  } catch {
    // Storage unavailable: it still applies for this visit.
  }
  paint(t)
}

// "Match device" follows the device if it changes while the app is open.
if (typeof window !== 'undefined') device().addEventListener('change', () => storedTheme() === 'system' && paint('system'))
