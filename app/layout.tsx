import type { Metadata } from 'next'
import Script from 'next/script'
import 'katex/dist/katex.min.css'
import 'highlight.js/styles/github-dark.css'
import './globals.css'
import Sidebar from '@/components/Sidebar'
import { getWikiIndex } from '@/lib/wiki-index'

export const metadata: Metadata = {
  title: 'llm-wiki',
}

const NO_FLASH_THEME_SCRIPT = `
(function () {
  try {
    var stored = localStorage.getItem('llm-wiki-theme');
    var theme = stored === 'light' || stored === 'dark'
      ? stored
      : (window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light');
    document.documentElement.setAttribute('data-theme', theme);
  } catch (e) {}
})();
`

export default function RootLayout({ children }: { children: React.ReactNode }) {
  const { navTree } = getWikiIndex()

  return (
    <html lang="ko" suppressHydrationWarning>
      <body>
        <Script id="no-flash-theme" strategy="beforeInteractive">
          {NO_FLASH_THEME_SCRIPT}
        </Script>
        <div className="layout">
          <Sidebar navTree={navTree} />
          <main className="content">{children}</main>
        </div>
      </body>
    </html>
  )
}
