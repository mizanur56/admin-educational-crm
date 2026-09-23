import { Input } from 'antd'

type DocumentFiltersProps = {
  search: string
  onSearchChange: (value: string) => void
  placeholder?: string
}

export default function DocumentFilters({
  search,
  onSearchChange,
  placeholder = 'Search document, owner, type…',
}: DocumentFiltersProps) {
  return (
    <Input.Search
      allowClear
      value={search}
      onChange={(event) => onSearchChange(event.target.value)}
      onSearch={onSearchChange}
      placeholder={placeholder}
    />
  )
}
