import { getWikiIndex } from '@/lib/wiki-index'
import NavTree from '@/components/NavTree'

export const dynamic = 'force-dynamic'

export default function Home() {
  const { navTree } = getWikiIndex()

  return (
    <article className="wiki-page">
      <header className="wiki-page-meta">
        <h1>llm-wiki</h1>
        <p className="index-desc">
          AI 에이전트가 관리하는 프로그래밍 지식 위키. 카테고리별로 문서를 정리해 둡니다.
        </p>
      </header>
      <h2 className="index-heading">목차</h2>
      <div className="index-tree">
        <NavTree nodes={navTree} path="" />
      </div>
    </article>
  )
}
