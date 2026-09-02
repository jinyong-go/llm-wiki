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

export default function Sidebar({ navTree, currentPath }: { navTree: NavNode[]; currentPath: string }) {
  return (
    <nav className="sidebar">
      <div className="sidebar-header">
        <a href="/" className="sidebar-home">
          <HomeIcon />
          LLM Wiki
        </a>
      </div>
      <NavTree nodes={navTree} path="" currentPath={currentPath} />
    </nav>
  )
}
