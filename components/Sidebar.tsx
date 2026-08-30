'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import type { NavNode } from '@/lib/wiki-index'
import ThemeToggle from './ThemeToggle'

function NavTree({ nodes, path, currentPath }: { nodes: NavNode[]; path: string; currentPath: string }) {
  return (
    <ul className="nav-list">
      {nodes.map((node) => {
        if (node.type === 'dir') {
          const dirPath = path ? `${path}/${node.name}` : node.name
          const isOpen = currentPath === dirPath || currentPath.startsWith(`${dirPath}/`)
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
            <Link href={`/${node.slug}`} className={currentPath === node.slug ? 'active' : ''}>
              {node.title}
            </Link>
          </li>
        )
      })}
    </ul>
  )
}

export default function Sidebar({ navTree }: { navTree: NavNode[] }) {
  const pathname = usePathname()
  const currentPath = pathname.replace(/^\//, '')

  return (
    <nav className="sidebar">
      <div className="sidebar-header">
        <Link href="/" className="sidebar-home">
          llm-wiki
        </Link>
        <ThemeToggle />
      </div>
      <NavTree nodes={navTree} path="" currentPath={currentPath} />
    </nav>
  )
}
