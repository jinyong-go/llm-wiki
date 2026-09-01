'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import type { NavNode } from '@/lib/wiki-index'
import NavTree from './NavTree'

function HomeIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M3 11.5 12 4l9 7.5" />
      <path d="M5 10v9a1 1 0 0 0 1 1h3v-6h6v6h3a1 1 0 0 0 1-1v-9" />
    </svg>
  )
}

export default function Sidebar({ navTree }: { navTree: NavNode[] }) {
  const pathname = usePathname()
  const currentPath = pathname.replace(/^\//, '')

  return (
    <nav className="sidebar">
      <div className="sidebar-header">
        <Link href="/" className="sidebar-home">
          <HomeIcon />
          LLM Wiki
        </Link>
      </div>
      <NavTree nodes={navTree} path="" currentPath={currentPath} />
    </nav>
  )
}
