import Link from 'next/link'

export default function Breadcrumb({ parts, pageTitle }: { parts: string[]; pageTitle?: string }) {
  const crumbs = parts.map((part, i) => {
    const href = `/${parts.slice(0, i + 1).join('/')}`
    const isLast = i === parts.length - 1
    return {
      key: href,
      label: isLast && pageTitle ? pageTitle : part,
      href: isLast ? undefined : href,
    }
  })

  return (
    <nav className="breadcrumb" aria-label="breadcrumb">
      <Link href="/">llm-wiki</Link>
      {crumbs.map((c) => (
        <span key={c.key} className="breadcrumb-item">
          <span className="breadcrumb-sep">›</span>
          {c.href ? <Link href={c.href}>{c.label}</Link> : <span className="breadcrumb-current">{c.label}</span>}
        </span>
      ))}
    </nav>
  )
}
