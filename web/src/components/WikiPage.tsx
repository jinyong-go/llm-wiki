import { useEffect } from 'react'
import { useLocation, useParams } from 'react-router-dom'
import type { Page } from '../types'
import pages from '../content/pages.json'

const pageBySlug = new Map((pages as Page[]).map((p) => [p.slug, p]))

export default function WikiPage() {
  const params = useParams<{ '*': string }>()
  const location = useLocation()
  const slug = params['*'] ?? ''
  const page = pageBySlug.get(slug)

  useEffect(() => {
    if (location.hash) {
      const el = document.getElementById(location.hash.slice(1))
      el?.scrollIntoView()
    } else {
      window.scrollTo(0, 0)
    }
  }, [slug, location.hash])

  if (!page) {
    return (
      <article className="wiki-page">
        <h1>페이지를 찾을 수 없음</h1>
        <p>
          <code>{slug}</code>에 해당하는 위키 페이지가 없습니다.
        </p>
      </article>
    )
  }

  return (
    <article className="wiki-page">
      <header className="wiki-page-meta">
        <h1>{page.title}</h1>
        <div className="wiki-page-tags">
          {page.updated && <span className="updated">updated {page.updated}</span>}
          {page.tags.map((tag) => (
            <span key={tag} className="tag">
              {tag}
            </span>
          ))}
        </div>
      </header>
      {/* html is generated at build time from wiki/*.md by scripts/build-content.mjs */}
      <div className="wiki-page-body" dangerouslySetInnerHTML={{ __html: page.html }} />
    </article>
  )
}
