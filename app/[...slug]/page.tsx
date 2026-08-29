import { notFound } from 'next/navigation'
import { getPage } from '@/lib/get-page'
import WikiArticle from '@/components/WikiArticle'

export const dynamic = 'force-dynamic'

export default async function WikiPage({ params }: { params: Promise<{ slug: string[] }> }) {
  const { slug: slugParts } = await params
  const slug = slugParts.join('/')

  const page = await getPage(slug)
  if (!page) notFound()

  return <WikiArticle meta={page.meta} html={page.html} />
}
