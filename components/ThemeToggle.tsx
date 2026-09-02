function SunIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
      <circle cx="12" cy="12" r="4" />
      <path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M4.93 19.07l1.41-1.41M17.66 6.34l1.41-1.41" />
    </svg>
  )
}

function MoonIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
    </svg>
  )
}

/** No React state — open/close and theme selection are wired up by the inline THEME_TOGGLE_SCRIPT (server/inline-scripts.ts) via DOM ids/attributes. */
export default function ThemeToggle() {
  return (
    <div className="theme-toggle">
      <button type="button" id="theme-toggle-btn" className="theme-toggle-btn" aria-haspopup="true">
        <SunIcon className="icon-sun" />
        <MoonIcon className="icon-moon" />
        테마
      </button>
      <div id="theme-toggle-menu" className="theme-toggle-menu" role="menu" hidden>
        <button type="button" className="theme-toggle-option" data-theme-choice="dark">
          <MoonIcon />
          다크
        </button>
        <button type="button" className="theme-toggle-option" data-theme-choice="light">
          <SunIcon />
          라이트
        </button>
      </div>
    </div>
  )
}
