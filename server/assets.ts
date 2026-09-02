import fs from 'node:fs'
import path from 'node:path'
import { createRequire } from 'node:module'

const require = createRequire(import.meta.url)
const ASSETS_DIR = path.join(process.cwd(), 'assets')

function readAsset(relPath: string): string {
  return fs.readFileSync(path.join(ASSETS_DIR, relPath), 'utf8')
}

const katexCss = fs.readFileSync(require.resolve('katex/dist/katex.min.css'), 'utf8')
const highlightCss = fs.readFileSync(require.resolve('highlight.js/styles/github-dark.css'), 'utf8')
const globalsCss = readAsset('globals.css')

export const CSS_BUNDLE = [katexCss, highlightCss, globalsCss].join('\n')

const iconSvg = fs.readFileSync(path.join(ASSETS_DIR, 'icon.svg'))
export const ICON_DATA_URI = `data:image/svg+xml;base64,${iconSvg.toString('base64')}`

export const FAVICON_BUFFER = fs.readFileSync(path.join(ASSETS_DIR, 'favicon.ico'))
