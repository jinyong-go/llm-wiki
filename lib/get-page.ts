import fs from 'node:fs'
import path from 'node:path'
import { WIKI_DIR } from './content-paths'
import { parseFrontmatter, formatUpdated, renderMarkdown } from './markdown'
import { getWikiIndex, type PageMeta } from './wiki-index'

export interface RenderedPage {
  meta: PageMeta
  html: string
  headings: { depth: number; text: string }[]
}

/** Reads and renders exactly one wiki/<slug>.md file on demand. Returns null if it doesn't exist. */
export async function getPage(slug: string): Promise<RenderedPage | null> {
  const relPath = `${slug}.md`
  const abs = path.join(WIKI_DIR, relPath)
  if (!fs.existsSync(abs)) return null

  const raw = fs.readFileSync(abs, 'utf8')
  const { data, content } = parseFrontmatter(raw, relPath)
  const index = getWikiIndex()

  const brokenLinks: string[] = []
  const { html, headings } = await renderMarkdown(content, {
    resolve: (name) => index.basenameToSlug.get(name),
    onBrokenLink: (target) => brokenLinks.push(target),
  })

  if (brokenLinks.length) {
    console.warn(`[wiki] broken wikilinks in ${slug}: ${brokenLinks.map((l) => `[[${l}]]`).join(', ')}`)
  }

  const parts = slug.split('/')
  const meta: PageMeta = {
    slug,
    title: (data.title as string) ?? path.basename(slug),
    updated: formatUpdated(data.updated),
    tags: (data.tags as string[]) ?? [],
    category: parts.length > 1 ? parts[0] : null,
  }

  return { meta, html, headings }
}
