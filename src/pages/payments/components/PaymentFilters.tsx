import { Input } from 'antd'

type PaymentFiltersProps = {
  search: string
  onSearchChange: (value: string) => void
  placeholder?: string
}

export default function PaymentFilters({
  search,
  onSearchChange,
  placeholder = 'Search invoice, payer, method…',
}: PaymentFiltersProps) {
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
