import { Helmet } from 'react-helmet-async'

export const PAGE_TITLE_SUFFIX = ' | EduConsult CRM'
const MAX_DESCRIPTION_LENGTH = 160

function truncateDescription(text: string) {
  const trimmed = text.trim()
  if (!trimmed) {
    return 'EduConsult CRM — education consultancy management platform.'
  }
  if (trimmed.length <= MAX_DESCRIPTION_LENGTH) {
    return trimmed
  }
  return `${trimmed.slice(0, MAX_DESCRIPTION_LENGTH - 1).trimEnd()}…`
}

function buildDocumentTitle(title: string) {
  const trimmed = title.trim()
  if (!trimmed) {
    return 'EduConsult CRM'
  }
  if (trimmed.endsWith(PAGE_TITLE_SUFFIX) || trimmed === 'EduConsult CRM') {
    return trimmed
  }
  return `${trimmed}${PAGE_TITLE_SUFFIX}`
}

const PageMeta = ({
  title,
  description,
}: {
  title: string
  description: string
}) => {
  const documentTitle = buildDocumentTitle(title)
  const metaDescription = truncateDescription(description)

  return (
    <Helmet>
      <title>{documentTitle}</title>
      <meta name="description" content={metaDescription} />
      <meta property="og:title" content={documentTitle} />
      <meta property="og:description" content={metaDescription} />
    </Helmet>
  )
}

export default PageMeta
