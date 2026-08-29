import { NavLink } from 'react-router-dom'
import type { NavNode } from '../types'
import navTree from '../content/nav.json'

function NavTree({ nodes, depth }: { nodes: NavNode[]; depth: number }) {
  return (
    <ul className="nav-list" style={{ '--depth': depth } as React.CSSProperties}>
      {nodes.map((node) =>
        node.type === 'dir' ? (
          <li key={node.name} className="nav-dir">
            <span className="nav-dir-label">{node.name}</span>
            <NavTree nodes={node.children} depth={depth + 1} />
          </li>
        ) : (
          <li key={node.slug} className="nav-page">
            <NavLink to={`/${node.slug}`} className={({ isActive }) => (isActive ? 'active' : '')}>
              {node.title}
            </NavLink>
          </li>
        ),
      )}
    </ul>
  )
}

export default function Sidebar() {
  return (
    <nav className="sidebar">
      <NavLink to="/" className="sidebar-home" end>
        llm-wiki
      </NavLink>
      <NavTree nodes={navTree as NavNode[]} depth={0} />
    </nav>
  )
}
