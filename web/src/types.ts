export interface Heading {
  depth: number
  text: string
}

export interface Page {
  slug: string
  title: string
  updated: string | null
  tags: string[]
  category: string | null
  headings: Heading[]
  html: string
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
