import fs from 'node:fs/promises'
import path from 'node:path'
import fg from 'fast-glob'
import matter from 'gray-matter'
import { unified } from 'unified'
import remarkParse from 'remark-parse'
import remarkGfm from 'remark-gfm'
import remarkMath from 'remark-math'
import remarkRehype from 'remark-rehype'
import rehypeSlug from 'rehype-slug'
import rehypeKatex from 'rehype-katex'
import rehypeHighlight from 'rehype-highlight'
import rehypeStringify from 'rehype-stringify'
import { visit } from 'unist-util-visit'
import { toString as mdastToString } from 'mdast-util-to-string'
import remarkWikilink from './remark-wikilink.mjs'

const CONTENT_ROOT = path.resolve(import.meta.dirname, '..', '..', 'llm-wiki')
const WIKI_DIR = path.join(CONTENT_ROOT, 'wiki')
const OUT_DIR = path.resolve(import.meta.dirname, '..', 'src', 'content')

function remarkCollectHeadings() {
  return (tree, file) => {
    const headings = []
    visit(tree, 'heading', (node) => {
      headings.push({ depth: node.depth, text: mdastToString(node) })
    })
    file.data.headings = headings
  }
}

function formatUpdated(value) {
  // gray-matter/js-yaml auto-parses unquoted `YYYY-MM-DD HH:MM:SS` as a UTC Date;
  // reformat it back to the original string instead of serializing as ISO 8601.
  if (!(value instanceof Date)) return value ?? null
  const pad = (n) => String(n).padStart(2, '0')
  return `${value.getUTCFullYear()}-${pad(value.getUTCMonth() + 1)}-${pad(value.getUTCDate())} ${pad(value.getUTCHours())}:${pad(value.getUTCMinutes())}:${pad(value.getUTCSeconds())}`
}

function slugFromRelPath(relPath) {
  return relPath.replace(/\\/g, '/').replace(/\.md$/, '')
}

function buildNavTree(entries) {
  const root = { type: 'dir', name: '', children: [] }
  for (const entry of entries) {
    if (entry.slug === 'index') continue
    const parts = entry.slug.split('/')
    let node = root
    for (let i = 0; i < parts.length - 1; i++) {
      const name = parts[i]
      let dir = node.children.find((c) => c.type === 'dir' && c.name === name)
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
      title: entry.data.title ?? parts[parts.length - 1],
    })
  }
  sortTree(root)
  return root.children
}

function sortTree(node) {
  node.children.sort((a, b) => {
    if (a.type !== b.type) return a.type === 'dir' ? -1 : 1
    return a.name.localeCompare(b.name)
  })
  for (const child of node.children) {
    if (child.type === 'dir') sortTree(child)
  }
}

async function main() {
  const relPaths = (await fg('**/*.md', { cwd: WIKI_DIR })).sort()

  // pass 1: read frontmatter + build basename -> slug lookup for wikilinks
  const entries = []
  const basenameToSlug = new Map()
  const duplicates = []
  const frontmatterErrors = []

  for (const relPath of relPaths) {
    const abs = path.join(WIKI_DIR, relPath)
    const raw = await fs.readFile(abs, 'utf8')
    let data = {}
    let content = raw
    try {
      ;({ data, content } = matter(raw))
    } catch (err) {
      frontmatterErrors.push({ relPath, message: err.message })
    }
    const slug = slugFromRelPath(relPath)
    const basename = path.basename(relPath, '.md')

    if (basenameToSlug.has(basename)) {
      duplicates.push({ basename, existing: basenameToSlug.get(basename), skipped: slug })
    } else {
      basenameToSlug.set(basename, slug)
    }

    entries.push({ slug, basename, data, content })
  }

  if (duplicates.length) {
    console.warn(`[build-content] ${duplicates.length} duplicate page name(s); [[wikilinks]] resolve to the first match only:`)
    for (const d of duplicates) {
      console.warn(`  [[${d.basename}]] -> ${d.existing}  (also found at ${d.skipped}, unreachable by wikilink)`)
    }
  }

  if (frontmatterErrors.length) {
    console.warn(`[build-content] ${frontmatterErrors.length} page(s) with unparsable frontmatter (title falls back to filename):`)
    for (const e of frontmatterErrors) {
      console.warn(`  ${e.relPath}: ${e.message}`)
    }
  }

  // pass 2: markdown -> html
  const pages = []
  const brokenLinksBySlug = []

  for (const entry of entries) {
    const localBroken = []
    const file = await unified()
      .use(remarkParse)
      .use(remarkGfm)
      .use(remarkMath)
      .use(remarkWikilink, {
        resolve: (name) => basenameToSlug.get(name),
        onBrokenLink: (name) => localBroken.push(name),
      })
      .use(remarkCollectHeadings)
      .use(remarkRehype)
      .use(rehypeSlug)
      .use(rehypeKatex)
      .use(rehypeHighlight)
      .use(rehypeStringify)
      .process(entry.content)

    if (localBroken.length) brokenLinksBySlug.push({ slug: entry.slug, links: localBroken })

    const parts = entry.slug.split('/')
    pages.push({
      slug: entry.slug,
      title: entry.data.title ?? entry.basename,
      updated: formatUpdated(entry.data.updated),
      tags: entry.data.tags ?? [],
      category: parts.length > 1 ? parts[0] : null,
      headings: file.data.headings ?? [],
      html: String(file),
    })
  }

  if (brokenLinksBySlug.length) {
    console.warn(`[build-content] broken wikilinks (target page not found):`)
    for (const b of brokenLinksBySlug) {
      console.warn(`  ${b.slug}: ${b.links.map((l) => `[[${l}]]`).join(', ')}`)
    }
  }

  const nav = buildNavTree(entries)

  await fs.mkdir(OUT_DIR, { recursive: true })
  await fs.writeFile(path.join(OUT_DIR, 'pages.json'), JSON.stringify(pages, null, 2))
  await fs.writeFile(path.join(OUT_DIR, 'nav.json'), JSON.stringify(nav, null, 2))

  console.log(`[build-content] ${pages.length} pages -> ${path.relative(process.cwd(), OUT_DIR)}/{pages,nav}.json`)
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
