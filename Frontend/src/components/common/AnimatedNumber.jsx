import { useEffect, useRef, useState } from 'react'
import { useInView } from 'framer-motion'
import { cn } from '@/utils/cn'
import { formatNumber } from '@/utils/format'

/**
 * Counts up to `value` when scrolled into view.
 */
export function AnimatedNumber({
  value = 0,
  duration = 1.2,
  decimals = 0,
  format,
  className,
  ...props
}) {
  const ref = useRef(null)
  const inView = useInView(ref, { once: true, margin: '-40px' })
  const [display, setDisplay] = useState(0)

  useEffect(() => {
    if (!inView) return undefined
    let frame
    const start = performance.now()
    const target = Number(value) || 0

    const tick = (now) => {
      const progress = Math.min((now - start) / (duration * 1000), 1)
      const eased = 1 - Math.pow(1 - progress, 3)
      setDisplay(target * eased)
      if (progress < 1) frame = requestAnimationFrame(tick)
    }

    frame = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(frame)
  }, [inView, value, duration])

  const rendered = format ? format(display) : formatNumber(display, { minimumFractionDigits: decimals, maximumFractionDigits: decimals })

  return (
    <span ref={ref} className={cn('tabular-nums', className)} {...props}>
      {rendered}
    </span>
  )
}

export default AnimatedNumber
