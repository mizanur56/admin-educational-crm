import type { ButtonHTMLAttributes, ReactNode } from 'react'

type ButtonVariant = 'primary' | 'secondary' | 'ghost'
type ButtonSize = 'sm' | 'md' | 'lg'

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: ButtonVariant
  size?: ButtonSize
  icon?: ReactNode
  fullWidth?: boolean
  loading?: boolean
}

export default function Button({
  children,
  variant = 'primary',
  size = 'md',
  type = 'button',
  icon,
  fullWidth = false,
  className = '',
  disabled = false,
  loading = false,
  ...props
}: ButtonProps) {
  const classes = [
    'ui-btn',
    `ui-btn-${variant}`,
    `ui-btn-${size}`,
    fullWidth ? 'ui-btn-block' : '',
    loading ? 'is-loading' : '',
    className,
  ]
    .filter(Boolean)
    .join(' ')

  return (
    <button type={type} className={classes} disabled={disabled || loading} aria-busy={loading} {...props}>
      {loading ? <span className="ui-btn-spinner" aria-hidden /> : icon ? <span className="ui-btn-icon">{icon}</span> : null}
      {children}
    </button>
  )
}
