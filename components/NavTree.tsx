import type { NavNode } from '@/lib/wiki-index'

export default function NavTree({
  nodes,
  path,
  currentPath,
}: {
  nodes: NavNode[]
  path: string
  currentPath?: string
}) {
  return (
    <ul className="nav-list">
      {nodes.map((node) => {
        if (node.type === 'dir') {
          const dirPath = path ? `${path}/${node.name}` : node.name
          const isOpen =
            currentPath !== undefined &&
            (currentPath === dirPath || currentPath.startsWith(`${dirPath}/`))
          return (
            <li key={node.name} className="nav-dir-item">
              <details className="nav-dir" open={isOpen}>
                <summary className="nav-dir-label">{node.name}</summary>
                <NavTree nodes={node.children} path={dirPath} currentPath={currentPath} />
              </details>
            </li>
          )
        }
        return (
          <li key={node.slug} className="nav-page">
            <a href={`/${node.slug}`} className={currentPath === node.slug ? 'active' : ''}>
              {node.title}
            </a>
          </li>
        )
      })}
    </ul>
  )
}
