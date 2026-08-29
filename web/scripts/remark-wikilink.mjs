import { visit } from 'unist-util-visit'
import GithubSlugger from 'github-slugger'

const WIKILINK_RE = /\[\[([^\]|]+)(?:\|([^\]]+))?\]\]/g

/**
 * Transforms `[[target]]` / `[[target|label]]` text into mdast link nodes.
 * `resolve(target)` must return the destination slug, or a falsy value if unknown.
 */
export default function remarkWikilink({ resolve, onBrokenLink } = {}) {
  return (tree) => {
    visit(tree, 'text', (node, index, parent) => {
      if (!parent || index === undefined || !node.value.includes('[[')) return

      const value = node.value
      const newNodes = []
      let lastIndex = 0
      let match

      WIKILINK_RE.lastIndex = 0
      while ((match = WIKILINK_RE.exec(value)) !== null) {
        const [full, rawTarget, rawLabel] = match
        if (match.index > lastIndex) {
          newNodes.push({ type: 'text', value: value.slice(lastIndex, match.index) })
        }

        const targetFull = rawTarget.trim()
        const [pageName, anchorRaw] = targetFull.split('#')
        const anchor = anchorRaw ? `#${new GithubSlugger().slug(anchorRaw)}` : ''
        const label = (rawLabel ?? (pageName || anchorRaw)).trim()

        let url
        if (!pageName) {
          // same-page anchor: [[#heading]]
          url = anchor
        } else {
          const targetSlug = resolve?.(pageName)
          if (targetSlug) url = `/${targetSlug}${anchor}`
        }

        if (url) {
          newNodes.push({
            type: 'link',
            url,
            data: { hProperties: { className: ['wikilink'] } },
            children: [{ type: 'text', value: label }],
          })
        } else {
          onBrokenLink?.(targetFull)
          newNodes.push({ type: 'text', value: label })
        }

        lastIndex = match.index + full.length
      }

      if (newNodes.length === 0) return
      if (lastIndex < value.length) {
        newNodes.push({ type: 'text', value: value.slice(lastIndex) })
      }

      parent.children.splice(index, 1, ...newNodes)
      return index + newNodes.length
    })
  }
}
