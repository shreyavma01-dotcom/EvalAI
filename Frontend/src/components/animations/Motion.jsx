import { motion } from 'framer-motion'
import {
  fade,
  fadeDown,
  fadeLeft,
  fadeRight,
  fadeUp,
  modalOverlay,
  modalPanel,
  page,
  scale,
  scaleIn,
  stagger,
  staggerItem,
} from './variants'
import { cn } from '@/utils/cn'

const DIRECTION_VARIANTS = {
  up: fadeUp,
  down: fadeDown,
  left: fadeLeft,
  right: fadeRight,
  none: fade,
}

export function FadeIn({ as = 'div', className, ...props }) {
  const Tag = motion[as]
  return <Tag variants={fade} initial="hidden" animate="visible" exit="exit" className={className} {...props} />
}

export function ScaleIn({ as = 'div', className, ...props }) {
  const Tag = motion[as]
  return <Tag variants={scaleIn} initial="hidden" animate="visible" exit="exit" className={className} {...props} />
}

export function SlideIn({ direction = 'up', as = 'div', className, ...props }) {
  const Tag = motion[as]
  return (
    <Tag variants={DIRECTION_VARIANTS[direction]} initial="hidden" animate="visible" exit="exit" className={className} {...props} />
  )
}

/**
 * Stagger parent — combine with <StaggerItem> children.
 */
export function Stagger({ className, gap = 0.08, delayChildren = 0, ...props }) {
  return (
    <motion.div
      variants={stagger(gap, delayChildren)}
      initial="hidden"
      animate="visible"
      exit="exit"
      className={className}
      {...props}
    />
  )
}

export function StaggerItem({ as = 'div', className, ...props }) {
  const Tag = motion[as]
  return <Tag variants={staggerItem} className={className} {...props} />
}

/**
 * Page-level enter/exit transition for routed screens.
 */
export function PageTransition({ className, children }) {
  return (
    <motion.div initial="initial" animate="animate" exit="exit" variants={page} className={className}>
      {children}
    </motion.div>
  )
}

/**
 * Modal backdrop + panel choreography.
 */
export function ModalTransition({ open, children }) {
  return (
    <motion.div
      variants={modalOverlay}
      initial="hidden"
      animate={open ? 'visible' : 'hidden'}
      exit="exit"
      className="fixed inset-0 z-modal flex items-center justify-center p-4"
    >
      {children}
    </motion.div>
  )
}

export function ModalPanel({ className, ...props }) {
  return <motion.div variants={modalPanel} initial="hidden" animate="visible" exit="exit" className={className} {...props} />
}

export function scaleOnHover({ className, ...props }) {
  return <motion.div variants={scale} whileHover="visible" className={className} {...props} />
}

export function motionProps() {
  return { initial: 'hidden', animate: 'visible', exit: 'exit' }
}

export { cn }
