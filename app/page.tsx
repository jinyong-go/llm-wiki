import { getPage } from '@/lib/get-page'

export const dynamic = 'force-dynamic'

export default async function Home() {
  const page = await getPage('index')

  if (!page) {
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
        <h1>{page.meta.title === 'index' ? 'llm-wiki' : page.meta.title}</h1>
      </header>
      <div className="wiki-page-body" dangerouslySetInnerHTML={{ __html: page.html }} />
    </article>
  )
}
