/**
 * Motion variants — the single source of truth for Framer Motion animations.
 */

export const EASE = [0.16, 1, 0.3, 1]
export const EASE_SPRING = [0.34, 1.56, 0.64, 1]

export const transitions = {
  fast: { duration: 0.15, ease: EASE },
  normal: { duration: 0.3, ease: EASE },
  slow: { duration: 0.5, ease: EASE },
  slower: { duration: 0.8, ease: EASE },
  spring: { type: 'spring', stiffness: 260, damping: 24 },
  springSoft: { type: 'spring', stiffness: 180, damping: 22 },
  springSnappy: { type: 'spring', stiffness: 400, damping: 30 },
}

export const fade = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: transitions.normal },
  exit: { opacity: 0, transition: { duration: 0.15, ease: 'easeIn' } },
}

export const fadeUp = {
  hidden: { opacity: 0, y: 24 },
  visible: { opacity: 1, y: 0, transition: transitions.normal },
  exit: { opacity: 0, y: 12, transition: { duration: 0.18, ease: 'easeIn' } },
}

export const fadeDown = {
  hidden: { opacity: 0, y: -24 },
  visible: { opacity: 1, y: 0, transition: transitions.normal },
  exit: { opacity: 0, y: -12, transition: { duration: 0.18, ease: 'easeIn' } },
}

export const fadeLeft = {
  hidden: { opacity: 0, x: 24 },
  visible: { opacity: 1, x: 0, transition: transitions.normal },
  exit: { opacity: 0, x: 12, transition: { duration: 0.18, ease: 'easeIn' } },
}

export const fadeRight = {
  hidden: { opacity: 0, x: -24 },
  visible: { opacity: 1, x: 0, transition: transitions.normal },
  exit: { opacity: 0, x: -12, transition: { duration: 0.18, ease: 'easeIn' } },
}

export const scale = {
  hidden: { opacity: 0, scale: 0.96 },
  visible: { opacity: 1, scale: 1, transition: transitions.springSoft },
  exit: { opacity: 0, scale: 0.96, transition: { duration: 0.15, ease: 'easeIn' } },
}

export const scaleIn = {
  hidden: { opacity: 0, scale: 0.9 },
  visible: { opacity: 1, scale: 1, transition: transitions.spring },
  exit: { opacity: 0, scale: 0.92, transition: { duration: 0.15, ease: 'easeIn' } },
}

/**
 * Parent container — staggers children that use the same visible state.
 * @param {number} [staggerChildren] delay between children (s)
 * @param {number} [delayChildren] delay before the first child (s)
 */
export const stagger = (staggerChildren = 0.08, delayChildren = 0) => ({
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren, delayChildren },
  },
  exit: { opacity: 0, transition: { duration: 0.15 } },
})

export const staggerItem = {
  hidden: { opacity: 0, y: 16 },
  visible: { opacity: 1, y: 0, transition: transitions.normal },
}

export const modalOverlay = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { duration: 0.2 } },
  exit: { opacity: 0, transition: { duration: 0.18 } },
}

export const modalPanel = {
  hidden: { opacity: 0, scale: 0.96, y: 12 },
  visible: { opacity: 1, scale: 1, y: 0, transition: transitions.springSoft },
  exit: { opacity: 0, scale: 0.97, y: 8, transition: { duration: 0.16, ease: 'easeIn' } },
}

export const drawerPanel = (side = 'right') => {
  const offset = side === 'right' ? '100%' : side === 'left' ? '-100%' : '100%'
  return {
    hidden: { x: offset },
    visible: { x: 0, transition: transitions.springSoft },
    exit: { x: offset, transition: { duration: 0.25, ease: EASE } },
  }
}

export const page = {
  initial: { opacity: 0, y: 12 },
  animate: { opacity: 1, y: 0, transition: transitions.normal },
  exit: { opacity: 0, y: -8, transition: { duration: 0.2, ease: 'easeIn' } },
}

export const list = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { staggerChildren: 0.06 } },
}

export const listItem = {
  hidden: { opacity: 0, x: -12 },
  visible: { opacity: 1, x: 0, transition: transitions.normal },
}

export const hoverLift = {
  whileHover: { y: -4, transition: transitions.springSoft },
  whileTap: { scale: 0.98 },
}

export const sidebarWidth = (width) => ({
  width,
  transition: { type: 'spring', stiffness: 220, damping: 28 },
})
