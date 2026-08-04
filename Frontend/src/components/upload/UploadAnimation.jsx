import { motion } from 'framer-motion'
import { UploadCloud } from 'lucide-react'
import { EASE } from '@/components/animations/variants'
import { cn } from '@/utils/cn'

/**
 * Reusable animated upload illustration.
 * Used in upload flows, empty states and processing screens.
 */
export function UploadAnimation({ size = 88, className, active = false, ...props }) {
  const icon = Math.round(size * 0.34)

  return (
    <motion.div
      className={cn('relative grid place-items-center', className)}
      style={{ width: size, height: size }}
      aria-hidden="true"
      {...props}
    >
      <motion.div
        className="absolute inset-0 rounded-3xl bg-gradient-to-br from-primary/25 via-secondary/20 to-info/20"
        animate={
          active
            ? { scale: [1, 1.08, 1], opacity: [0.7, 1, 0.7] }
            : { scale: 1, opacity: 0.8 }
        }
        transition={{ duration: 2.4, repeat: active ? Infinity : 0, ease: 'easeInOut' }}
      />
      <motion.div
        className="relative grid place-items-center rounded-2xl bg-background/80 shadow-floating backdrop-blur-md"
        style={{ width: size * 0.72, height: size * 0.72 }}
        animate={active ? { y: [0, -6, 0] } : { y: 0 }}
        transition={{ duration: 2.8, repeat: active ? Infinity : 0, ease: 'easeInOut' }}
      >
        <UploadCloud style={{ width: icon, height: icon }} className="text-primary" strokeWidth={1.6} />
      </motion.div>
      <motion.div
        className="absolute -bottom-1 left-1/2 h-2 -translate-x-1/2 rounded-full bg-black/10 blur-sm dark:bg-black/40"
        style={{ width: size * 0.5 }}
        animate={active ? { width: [size * 0.5, size * 0.36, size * 0.5], opacity: [0.5, 0.3, 0.5] } : {}}
        transition={{ duration: 2.8, repeat: active ? Infinity : 0, ease: EASE }}
      />
    </motion.div>
  )
}

export default UploadAnimation
