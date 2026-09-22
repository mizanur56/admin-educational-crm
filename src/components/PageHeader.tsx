import { Breadcrumb, Divider, Typography } from 'antd'
import type { ReactNode } from 'react'
import { Link } from 'react-router-dom'

const { Title } = Typography

export type PageHeaderBreadcrumb = {
  title: string
  path?: string
}

type PageHeaderProps = {
  title: string
  subtitle?: string
  breadcrumbs?: PageHeaderBreadcrumb[]
  extra?: ReactNode
}

export default function PageHeader({
  title,
  subtitle,
  breadcrumbs = [],
  extra,
}: PageHeaderProps) {
  return (
    <div className="mb-0">
      {breadcrumbs.length > 0 ? (
        <Breadcrumb
          className="mb-2"
          items={breadcrumbs.map((item, index) => {
            const isLast = index === breadcrumbs.length - 1
            return {
              title:
                item.path && !isLast ? (
                  <Link to={item.path}>{item.title}</Link>
                ) : (
                  <span className={isLast ? 'font-medium text-primary' : undefined}>{item.title}</span>
                ),
            }
          })}
        />
      ) : null}
      <div className="flex w-full flex-col justify-between sm:items-center md:flex-row">
        <div>
          <Title level={4} className="!mb-0 !text-text">
            {title}
          </Title>
          {subtitle ? <p className="mt-1 mb-0 text-sm text-text-muted">{subtitle}</p> : null}
        </div>
        {extra ? (
          <div className="mt-4 flex flex-wrap items-center gap-2 sm:mt-0">{extra}</div>
        ) : null}
      </div>
      <Divider className="my-4" />
    </div>
  )
}
