import { notFound } from 'next/navigation'
import { getPage } from '@/lib/get-page'
import { getWikiIndex, findDirNode } from '@/lib/wiki-index'
import WikiArticle from '@/components/WikiArticle'
import DirectoryListing from '@/components/DirectoryListing'
import Breadcrumb from '@/components/Breadcrumb'

export const dynamic = 'force-dynamic'

export default async function WikiPage({ params }: { params: Promise<{ slug: string[] }> }) {
  const { slug: slugParts } = await params
  const slug = slugParts.join('/')

  const page = await getPage(slug)
  if (page) {
    return (
      <>
        <Breadcrumb parts={slugParts} pageTitle={page.meta.title} />
        <WikiArticle meta={page.meta} html={page.html} />
      </>
    )
  }

  const { navTree } = getWikiIndex()
  const dirNode = findDirNode(navTree, slugParts)
  if (!dirNode) notFound()

  return (
    <>
      <Breadcrumb parts={slugParts} />
      <DirectoryListing path={slug} nodes={dirNode.children} />
    </>
  )
}
