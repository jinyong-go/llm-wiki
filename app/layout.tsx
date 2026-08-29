import type { Metadata } from 'next'
import 'katex/dist/katex.min.css'
import 'highlight.js/styles/github-dark.css'
import './globals.css'
import Sidebar from '@/components/Sidebar'
import { getWikiIndex } from '@/lib/wiki-index'

export const metadata: Metadata = {
  title: 'llm-wiki',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  const { navTree } = getWikiIndex()

  return (
    <html lang="ko">
      <body>
        <div className="layout">
          <Sidebar navTree={navTree} />
          <main className="content">{children}</main>
        </div>
      </body>
    </html>
  )
}
