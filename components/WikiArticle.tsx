import type { PageMeta } from '@/lib/wiki-index'

export default function WikiArticle({
  meta,
  html,
  showTitle = true,
}: {
  meta: PageMeta
  html: string
  showTitle?: boolean
}) {
  return (
    <article className="wiki-page">
      {showTitle && (
        <header className="wiki-page-meta">
          <h1>{meta.title}</h1>
          <div className="wiki-page-tags">
            {meta.updated && <span className="updated">updated {meta.updated}</span>}
            {meta.tags.map((tag) => (
              <span key={tag} className="tag">
                {tag}
              </span>
            ))}
          </div>
        </header>
      )}
      {/* html is rendered server-side per request from wiki/*.md via lib/markdown.ts — not user-submitted content */}
      <div className="wiki-page-body" dangerouslySetInnerHTML={{ __html: html }} />
    </article>
  )
}
