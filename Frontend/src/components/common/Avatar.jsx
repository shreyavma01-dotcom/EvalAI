import { useState } from 'react'
import { User } from 'lucide-react'
import { cva } from 'class-variance-authority'
import { cn } from '@/utils/cn'
import { initials } from '@/utils/format'

const avatarVariants = cva('relative inline-grid shrink-0 place-items-center select-none', {
  variants: {
    size: {
      xs: 'size-6 text-[9px]',
      sm: 'size-8 text-[11px]',
      md: 'size-10 text-xs',
      lg: 'size-12 text-sm',
      xl: 'size-16 text-base',
      '2xl': 'size-20 text-lg',
    },
    shape: {
      circle: 'rounded-full',
      square: 'rounded-xl',
    },
  },
  defaultVariants: {
    size: 'md',
    shape: 'circle',
  },
})

const STATUS_COLORS = {
  online: 'bg-success',
  offline: 'bg-muted',
  busy: 'bg-danger',
  away: 'bg-warning',
}

const GRADIENTS = [
  'from-primary to-secondary',
  'from-info to-secondary',
  'from-warning to-danger',
  'from-success to-info',
  'from-primary-strong to-info',
]

function hashString(value) {
  let hash = 0
  for (let i = 0; i < value.length; i += 1) {
    hash = (hash << 5) - hash + value.charCodeAt(i)
    hash |= 0
  }
  return Math.abs(hash)
}

/**
 * Avatar with image, initials fallback, status dot and optional ring.
 */
export function Avatar({
  src,
  name = '',
  size = 'md',
  shape = 'circle',
  status,
  ring = false,
  className,
  alt,
  ...props
}) {
  const [error, setError] = useState(false)
  const gradient = GRADIENTS[hashString(name || 'user') % GRADIENTS.length]
  const fallback = name ? initials(name) : null

  return (
    <span
      className={cn(
        avatarVariants({ size, shape }),
        !src || error ? cn('bg-gradient-to-br font-semibold text-white', gradient) : 'bg-background-soft',
        ring && 'ring-2 ring-background',
        className,
      )}
      {...props}
    >
      {src && !error ? (
        <img
          src={src}
          alt={alt ?? name}
          onError={() => setError(true)}
          className="h-full w-full object-cover"
          style={{ borderRadius: 'inherit' }}
        />
      ) : fallback ? (
        fallback
      ) : (
        <User className="size-[45%]" />
      )}
      {status ? (
        <span
          className={cn(
            'absolute bottom-0 right-0 block rounded-full ring-2 ring-surface',
            size === 'xs' ? 'size-1.5' : 'size-2.5',
            STATUS_COLORS[status],
          )}
          aria-label={status}
        />
      ) : null}
    </span>
  )
}

/**
 * Stacked avatar group with overflow indicator.
 */
export function AvatarGroup({ users = [], size = 'md', max = 4, className }) {
  const visible = users.slice(0, max)
  const overflow = users.length - visible.length

  return (
    <span className={cn('flex -space-x-2', className)}>
      {visible.map((user, index) => (
        <span key={user.id ?? index} className="rounded-full ring-2 ring-surface">
          <Avatar {...user} size={size} />
        </span>
      ))}
      {overflow > 0 ? (
        <span className={cn(avatarVariants({ size }), 'bg-background-soft text-muted ring-2 ring-surface')}>
          +{overflow}
        </span>
      ) : null}
    </span>
  )
}

export default Avatar
