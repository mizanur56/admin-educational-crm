import type { HTMLAttributes } from 'react'

const WAVE_BAR_HEIGHTS = ['50%', '75%', '100%', '75%', '50%']

type WaveProps = HTMLAttributes<HTMLSpanElement>

export function Wave({ className = '', ...props }: WaveProps) {
  return (
    <>
      <style>
        {`
          @keyframes loading-ui-wave {
            0%,
            100% {
              transform: scaleY(1);
            }

            50% {
              transform: scaleY(0.6);
            }
          }
        `}
      </style>
      <span
        role="status"
        className={`inline-flex items-center gap-[2.5%] text-current${className ? ` ${className}` : ''}`}
        {...props}
      >
        {WAVE_BAR_HEIGHTS.map((height, index) => (
          <span
            key={index}
            aria-hidden="true"
            className="inline-block origin-center rounded-full bg-current"
            style={{
              width: '12.5%',
              height,
              animation: 'loading-ui-wave var(--duration, 1s) ease-in-out infinite',
              animationDelay: `calc(var(--delay, 100ms) * ${index})`,
            }}
          />
        ))}
        <span className="sr-only">Loading</span>
      </span>
    </>
  )
}
