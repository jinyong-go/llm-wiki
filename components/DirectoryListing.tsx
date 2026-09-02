import type { NavNode } from '@/lib/wiki-index'

export default function DirectoryListing({ path, nodes }: { path: string; nodes: NavNode[] }) {
  const name = path.split('/').pop() ?? path
  const dirs = nodes.filter((n) => n.type === 'dir')
  const pages = nodes.filter((n) => n.type === 'page')

  return (
    <article className="wiki-page">
      <header className="wiki-page-meta">
        <h1>{name}</h1>
      </header>
      <div className="wiki-page-body">
        {dirs.length > 0 && (
          <section>
            <h2>하위 디렉터리</h2>
            <ul>
              {dirs.map((d) => (
                <li key={d.name}>
                  <a href={`/${path}/${d.name}`}>{d.name}</a>
                </li>
              ))}
            </ul>
          </section>
        )}
        {pages.length > 0 && (
          <section>
            <h2>문서</h2>
            <ul>
              {pages.map((p) => (
                <li key={p.slug}>
                  <a href={`/${p.slug}`}>{p.title}</a>
                </li>
              ))}
            </ul>
          </section>
        )}
      </div>
    </article>
  )
}
