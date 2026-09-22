import { Helmet } from 'react-helmet-async'

const PageMeta = ({
  title,
  description,
}: {
  title: string
  description: string
}) => (
  <Helmet>
    <title>{title}</title>
    <meta name="description" content={description} />
  </Helmet>
)

export default PageMeta
