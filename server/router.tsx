import { getPage } from '@/lib/get-page'
import { getWikiIndex, findDirNode } from '@/lib/wiki-index'
import WikiArticle from '@/components/WikiArticle'
import DirectoryListing from '@/components/DirectoryListing'
import Breadcrumb from '@/components/Breadcrumb'
import NavTree from '@/components/NavTree'
import { renderShell } from './shell'

export async function renderRoute(pathname: string): Promise<{ status: number; html: string }> {
  const parts = pathname.replace(/^\/+|\/+$/g, '').split('/').filter(Boolean)
  const slug = parts.join('/')
  const { navTree } = getWikiIndex()

  if (slug === '') {
    const html = renderShell({
      navTree,
      currentPath: '',
      children: (
        <article className="wiki-page">
          <header className="wiki-page-meta">
            <h1>llm-wiki</h1>
            <p className="index-desc">
              AI 에이전트가 관리하는 프로그래밍 지식 위키. 카테고리별로 문서를 정리해 둡니다.
            </p>
          </header>
          <h2 className="index-heading">목차</h2>
          <div className="index-tree">
            <NavTree nodes={navTree} path="" />
          </div>
        </article>
      ),
    })
    return { status: 200, html }
  }

  const page = await getPage(slug)
  if (page) {
    const html = renderShell({
      navTree,
      currentPath: slug,
      children: (
        <>
          <Breadcrumb parts={parts} pageTitle={page.meta.title} />
          <WikiArticle meta={page.meta} html={page.html} />
        </>
      ),
    })
    return { status: 200, html }
  }

  const dirNode = findDirNode(navTree, parts)
  if (dirNode) {
    const html = renderShell({
      navTree,
      currentPath: slug,
      children: (
        <>
          <Breadcrumb parts={parts} />
          <DirectoryListing path={slug} nodes={dirNode.children} />
        </>
      ),
    })
    return { status: 200, html }
  }

  const html = renderShell({
    navTree,
    currentPath: slug,
    children: (
      <article className="wiki-page">
        <h1>페이지를 찾을 수 없음</h1>
        <p>요청한 위키 페이지가 존재하지 않습니다.</p>
      </article>
    ),
  })
  return { status: 404, html }
}
