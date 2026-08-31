'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import type { NavNode } from '@/lib/wiki-index'
import NavTree from './NavTree'
import ThemeToggle from './ThemeToggle'

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
