import { motion } from 'framer-motion'
import { cn } from '@/utils/cn'

/**
 * Animated gradient orbs for premium backgrounds.
 * Place inside a `relative overflow-hidden` container.
 */
export function FloatingGradient({ className, variant = 'primary', intensity = 1 }) {
  const palette = {
    primary: ['rgb(var(--primary) / 0.28)', 'rgb(var(--secondary) / 0.24)', 'rgb(var(--info) / 0.2)'],
    neutral: ['rgb(var(--foreground) / 0.07)', 'rgb(var(--foreground) / 0.05)', 'rgb(var(--foreground) / 0.06)'],
  }[variant]

  const blobs = [
    { top: '-12%', left: '-8%', size: '42vmax', color: palette[0], delay: 0, duration: 14 },
    { top: '38%', right: '-12%', size: '36vmax', color: palette[1], delay: -4, duration: 17 },
    { bottom: '-18%', left: '28%', size: '40vmax', color: palette[2], delay: -8, duration: 20 },
  ]

  return (
    <div className={cn('pointer-events-none absolute inset-0 overflow-hidden', className)} aria-hidden="true">
      {blobs.map((blob, index) => (
        <motion.div
          key={index}
          className="absolute rounded-full blur-3xl"
          style={{
            top: blob.top,
            left: blob.left,
            right: blob.right,
            bottom: blob.bottom,
            width: blob.size,
            height: blob.size,
            backgroundColor: blob.color,
            opacity: intensity,
          }}
          animate={{ x: [0, 40, -24, 0], y: [0, -32, 24, 0], scale: [1, 1.12, 0.94, 1] }}
          transition={{
            duration: blob.duration,
            delay: blob.delay,
            repeat: Infinity,
            ease: 'easeInOut',
          }}
        />
      ))}
    </div>
  )
}

export default FloatingGradient
