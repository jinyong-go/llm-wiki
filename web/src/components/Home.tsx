import type { Page } from '../types'
import pages from '../content/pages.json'

const indexPage = (pages as Page[]).find((p) => p.slug === 'index')

export default function Home() {
  if (!indexPage) {
    return (
      <article className="wiki-page">
        <h1>llm-wiki</h1>
        <p>wiki/index.md 를 찾을 수 없습니다.</p>
      </article>
    )
  }

  return (
    <article className="wiki-page">
      <header className="wiki-page-meta">
        <h1>{indexPage.title === 'index' ? 'llm-wiki' : indexPage.title}</h1>
      </header>
      <div className="wiki-page-body" dangerouslySetInnerHTML={{ __html: indexPage.html }} />
    </article>
  )
}
