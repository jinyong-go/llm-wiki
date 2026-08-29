'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import type { NavNode } from '@/lib/wiki-index'

function NavTree({ nodes, depth }: { nodes: NavNode[]; depth: number }) {
  const pathname = usePathname()

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
            <Link href={`/${node.slug}`} className={pathname === `/${node.slug}` ? 'active' : ''}>
              {node.title}
            </Link>
          </li>
        ),
      )}
    </ul>
  )
}

export default function Sidebar({ navTree }: { navTree: NavNode[] }) {
  return (
    <nav className="sidebar">
      <Link href="/" className="sidebar-home">
        llm-wiki
      </Link>
      <NavTree nodes={navTree} depth={0} />
    </nav>
  )
}
