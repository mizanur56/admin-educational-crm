import { Select as AntSelect } from 'antd'
import type { SelectProps } from 'antd'

export default function Select({ className, style, ...props }: SelectProps) {
  return (
    <AntSelect
      className={['w-full', className].filter(Boolean).join(' ')}
      style={{ width: '100%', ...style }}
      {...props}
    />
  )
}
