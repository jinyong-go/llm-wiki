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
      <a href="/">llm-wiki</a>
      {crumbs.map((c) => (
        <span key={c.key} className="breadcrumb-item">
          <span className="breadcrumb-sep">›</span>
          {c.href ? <a href={c.href}>{c.label}</a> : <span className="breadcrumb-current">{c.label}</span>}
        </span>
      ))}
    </nav>
  )
}
