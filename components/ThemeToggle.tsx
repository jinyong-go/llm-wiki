'use client'

import { useEffect, useLayoutEffect, useRef, useState, useSyncExternalStore } from 'react'

type Theme = 'light' | 'dark'

const STORAGE_KEY = 'llm-wiki-theme'
const listeners = new Set<() => void>()

/** Mirrors the inline no-flash script's logic, for routes where that script doesn't execute (e.g. the not-found boundary, which Next reconstructs client-side from RSC data instead of parsing raw HTML). */
function resolveInitialTheme(): Theme {
  let stored: string | null = null
  try {
    stored = localStorage.getItem(STORAGE_KEY)
  } catch {
    // ignore
  }
  if (stored === 'light' || stored === 'dark') return stored
  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
}

function applyTheme(theme: Theme) {
  document.documentElement.setAttribute('data-theme', theme)
  try {
    localStorage.setItem(STORAGE_KEY, theme)
  } catch {
    // localStorage unavailable (private mode, etc.) — theme just won't persist
  }
  listeners.forEach((listener) => listener())
}

function subscribe(listener: () => void) {
  listeners.add(listener)
  return () => listeners.delete(listener)
}

function getSnapshot(): Theme {
  return document.documentElement.getAttribute('data-theme') === 'dark' ? 'dark' : 'light'
}

function getServerSnapshot(): Theme {
  return 'light'
}

function SunIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
      <circle cx="12" cy="12" r="4" />
      <path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M4.93 19.07l1.41-1.41M17.66 6.34l1.41-1.41" />
    </svg>
  )
}

function MoonIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
    </svg>
  )
}

export default function ThemeToggle() {
  const theme = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot)
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  useLayoutEffect(() => {
    if (!document.documentElement.hasAttribute('data-theme')) {
      applyTheme(resolveInitialTheme())
    }
  }, [])

  useEffect(() => {
    function onClickOutside(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('click', onClickOutside)
    return () => document.removeEventListener('click', onClickOutside)
  }, [])

  function choose(next: Theme) {
    applyTheme(next)
    setOpen(false)
  }

  return (
    <div className="theme-toggle" ref={ref}>
      <button type="button" className="theme-toggle-btn" onClick={() => setOpen((v) => !v)} aria-haspopup="true" aria-expanded={open}>
        {theme === 'dark' ? <MoonIcon /> : <SunIcon />}
        테마
      </button>
      {open && (
        <div className="theme-toggle-menu" role="menu">
          <button type="button" className={`theme-toggle-option${theme === 'dark' ? ' active' : ''}`} onClick={() => choose('dark')}>
            <MoonIcon />
            다크
          </button>
          <button type="button" className={`theme-toggle-option${theme === 'light' ? ' active' : ''}`} onClick={() => choose('light')}>
            <SunIcon />
            라이트
          </button>
        </div>
      )}
    </div>
  )
}
