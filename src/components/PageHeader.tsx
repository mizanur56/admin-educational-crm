import type { ReactNode } from 'react'

type PageHeaderProps = {
  title: string
  description?: string
  children?: ReactNode
}

export default function PageHeader({ title, description, children }: PageHeaderProps) {
  return (
    <header className="flex items-start justify-between gap-4 pt-0">
      <div>
        <h2 className="m-0 text-[1.2rem] tracking-[-0.02em] text-text">{title}</h2>
        {description ? (
          <p className="mt-1 mb-0 text-[0.85rem] text-text-muted">{description}</p>
        ) : null}
      </div>
      {children ? <div className="flex shrink-0 items-center gap-2">{children}</div> : null}
    </header>
  )
}
