import { getWikiIndex } from '@/lib/wiki-index'
import NavTree from '@/components/NavTree'

export const dynamic = 'force-dynamic'

export default function Home() {
  const { navTree } = getWikiIndex()

  return (
    <article className="wiki-page">
      <header className="wiki-page-meta">
        <h1>llm-wiki</h1>
      </header>
      <div className="index-tree">
        <NavTree nodes={navTree} path="" />
      </div>
    </article>
  )
}
