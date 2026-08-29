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
import remarkWikilink from './remark-wikilink'

export interface Heading {
  depth: number
  text: string
}

export interface Frontmatter {
  title?: string
  updated?: string
  tags?: string[]
  [key: string]: unknown
}

export interface ParsedPage {
  data: Frontmatter
  content: string
  frontmatterError: string | null
}

/**
 * gray-matter/js-yaml auto-parses unquoted `YYYY-MM-DD HH:MM:SS` as a UTC Date,
 * and rejects titles starting with YAML-reserved characters (`@`, backtick, ...).
 * Reformat dates back to the original string and fall back gracefully on parse errors.
 */
export function formatUpdated(value: unknown): string | null {
  if (!(value instanceof Date)) return (value as string) ?? null
  const pad = (n: number) => String(n).padStart(2, '0')
  return `${value.getUTCFullYear()}-${pad(value.getUTCMonth() + 1)}-${pad(value.getUTCDate())} ${pad(value.getUTCHours())}:${pad(value.getUTCMinutes())}:${pad(value.getUTCSeconds())}`
}

export function parseFrontmatter(raw: string, relPath: string): ParsedPage {
  try {
    const { data, content } = matter(raw)
    return { data, content, frontmatterError: null }
  } catch (err) {
    console.warn(`[markdown] unparsable frontmatter in ${relPath}: ${(err as Error).message}`)
    return { data: {}, content: raw, frontmatterError: (err as Error).message }
  }
}

function remarkCollectHeadings() {
  return (tree: any, file: any) => {
    const headings: Heading[] = []
    visit(tree, 'heading', (node: any) => {
      headings.push({ depth: node.depth, text: mdastToString(node) })
    })
    file.data.headings = headings
  }
}

interface RenderOptions {
  resolve: (pageName: string) => string | undefined
  onBrokenLink?: (target: string) => void
}

export async function renderMarkdown(content: string, { resolve, onBrokenLink }: RenderOptions) {
  const file = await unified()
    .use(remarkParse)
    .use(remarkGfm)
    .use(remarkMath)
    .use(remarkWikilink, { resolve, onBrokenLink })
    .use(remarkCollectHeadings)
    .use(remarkRehype)
    .use(rehypeSlug)
    .use(rehypeKatex)
    .use(rehypeHighlight)
    .use(rehypeStringify)
    .process(content)

  return {
    html: String(file),
    headings: (file.data.headings as Heading[]) ?? [],
  }
}
