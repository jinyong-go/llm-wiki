import fs from 'node:fs'
import path from 'node:path'
import fg from 'fast-glob'
import { WIKI_DIR } from './content-paths'
import { parseFrontmatter, formatUpdated, type Frontmatter } from './markdown'

export interface PageMeta {
  slug: string
  title: string
  updated: string | null
  tags: string[]
  category: string | null
}

export interface NavPage {
  type: 'page'
  name: string
  slug: string
  title: string
}

export interface NavDir {
  type: 'dir'
  name: string
  children: NavNode[]
}

export type NavNode = NavDir | NavPage

export interface WikiIndex {
  basenameToSlug: Map<string, string>
  pages: Map<string, PageMeta>
  navTree: NavNode[]
}

function slugFromRelPath(relPath: string): string {
  return relPath.replace(/\\/g, '/').replace(/\.md$/, '')
}

function buildNavTree(entries: { slug: string; data: Frontmatter; basename: string }[]): NavNode[] {
  const root: NavDir = { type: 'dir', name: '', children: [] }
  for (const entry of entries) {
    if (entry.slug === 'index') continue
    const parts = entry.slug.split('/')
    let node = root
    for (let i = 0; i < parts.length - 1; i++) {
      const name = parts[i]
      let dir = node.children.find((c): c is NavDir => c.type === 'dir' && c.name === name)
      if (!dir) {
        dir = { type: 'dir', name, children: [] }
        node.children.push(dir)
      }
      node = dir
    }
    node.children.push({
      type: 'page',
      name: parts[parts.length - 1],
      slug: entry.slug,
      title: (entry.data.title as string) ?? parts[parts.length - 1],
    })
  }
  sortTree(root)
  return root.children
}

function sortTree(node: NavDir) {
  node.children.sort((a, b) => {
    if (a.type !== b.type) return a.type === 'dir' ? -1 : 1
    return a.name.localeCompare(b.name)
  })
  for (const child of node.children) {
    if (child.type === 'dir') sortTree(child)
  }
}

function buildIndex(): WikiIndex {
  const relPaths = fg.sync('**/*.md', { cwd: WIKI_DIR }).sort()

  const entries: { slug: string; basename: string; data: Frontmatter }[] = []
  const basenameToSlug = new Map<string, string>()
  const pages = new Map<string, PageMeta>()

  for (const relPath of relPaths) {
    const abs = path.join(WIKI_DIR, relPath)
    const raw = fs.readFileSync(abs, 'utf8')
    const { data } = parseFrontmatter(raw, relPath)
    const slug = slugFromRelPath(relPath)
    const basename = path.basename(relPath, '.md')

    if (!basenameToSlug.has(basename)) basenameToSlug.set(basename, slug)

    entries.push({ slug, basename, data })

    const parts = slug.split('/')
    pages.set(slug, {
      slug,
      title: (data.title as string) ?? basename,
      updated: formatUpdated(data.updated),
      tags: (data.tags as string[]) ?? [],
      category: parts.length > 1 ? parts[0] : null,
    })
  }

  return { basenameToSlug, pages, navTree: buildNavTree(entries) }
}

/** Walks navTree by path segments and returns the matching directory node, or null if no page lives under that path. */
export function findDirNode(nodes: NavNode[], parts: string[]): NavDir | null {
  if (parts.length === 0) return { type: 'dir', name: '', children: nodes }
  const [head, ...rest] = parts
  const match = nodes.find((n): n is NavDir => n.type === 'dir' && n.name === head)
  if (!match) return null
  return rest.length === 0 ? match : findDirNode(match.children, rest)
}

let cached: WikiIndex | null = null

/** Lightweight index (frontmatter + slugs only, no markdown body conversion). Cached in production; rebuilt on every call in dev so md edits show up without a restart. */
export function getWikiIndex(): WikiIndex {
  if (process.env.NODE_ENV === 'development') return buildIndex()
  if (!cached) cached = buildIndex()
  return cached
}
