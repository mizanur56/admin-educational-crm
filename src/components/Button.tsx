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

const base =
  'inline-flex items-center justify-center gap-2 border border-transparent rounded-(--radius-btn) font-inherit font-semibold leading-tight whitespace-nowrap cursor-pointer transition-[background-color,opacity,box-shadow] duration-150 ease-in-out disabled:opacity-65 disabled:cursor-not-allowed'

const variants: Record<ButtonVariant, string> = {
  primary:
    'bg-primary text-on-primary shadow-[0_6px_16px_rgb(18_120_111_/_0.18)] hover:enabled:bg-primary-hover active:enabled:bg-primary-active',
  secondary: 'bg-surface border-header-border text-text-strong hover:enabled:bg-hover-bg',
  ghost: 'bg-transparent text-primary hover:enabled:bg-primary/10',
}

const sizes: Record<ButtonSize, string> = {
  sm: 'min-h-[34px] px-3 py-1.5 text-[0.82rem]',
  md: 'min-h-[42px] px-4 py-2.5 text-[0.92rem]',
  lg: 'min-h-12 px-5 py-3 text-[0.95rem]',
}

function cx(...parts: Array<string | false | undefined>) {
  return parts.filter(Boolean).join(' ')
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
  return (
    <button
      type={type}
      className={cx(base, variants[variant], sizes[size], fullWidth && 'w-full', className)}
      disabled={disabled || loading}
      aria-busy={loading}
      {...props}
    >
      {loading ? (
        <span
          className="size-3.5 shrink-0 rounded-full border-2 border-current border-r-transparent animate-spin"
          aria-hidden
        />
      ) : icon ? (
        <span className="grid place-items-center [&_svg]:block">{icon}</span>
      ) : null}
      {children}
    </button>
  )
}
