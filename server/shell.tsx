import { renderToStaticMarkup } from 'react-dom/server'
import Sidebar from '@/components/Sidebar'
import ThemeToggle from '@/components/ThemeToggle'
import type { NavNode } from '@/lib/wiki-index'
import { CSS_BUNDLE, ICON_DATA_URI } from './assets'
import { NO_FLASH_THEME_SCRIPT, THEME_TOGGLE_SCRIPT } from './inline-scripts'

export function renderShell({
  navTree,
  currentPath,
  children,
}: {
  navTree: NavNode[]
  currentPath: string
  children: React.ReactNode
}): string {
  const body = (
    <html lang="ko">
      <head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <title>용's LLM Wiki</title>
        <link rel="icon" href={ICON_DATA_URI} />
        <script dangerouslySetInnerHTML={{ __html: NO_FLASH_THEME_SCRIPT }} />
        <style dangerouslySetInnerHTML={{ __html: CSS_BUNDLE }} />
      </head>
      <body>
        <div className="layout">
          <Sidebar navTree={navTree} currentPath={currentPath} />
          <main className="content">{children}</main>
        </div>
        <ThemeToggle />
        <script dangerouslySetInnerHTML={{ __html: THEME_TOGGLE_SCRIPT }} />
      </body>
    </html>
  )

  return `<!DOCTYPE html>${renderToStaticMarkup(body)}`
}
