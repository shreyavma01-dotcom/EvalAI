import { useEffect } from 'react'

/**
 * Invoke a handler when a click/pointer lands outside the referenced element.
 * @param {import('react').RefObject<HTMLElement|null>} ref
 * @param {(event: Event) => void} handler
 * @param {boolean} active
 */
export function useClickOutside(ref, handler, active = true) {
  useEffect(() => {
    if (!active) return undefined

    const listener = (event) => {
      const el = ref.current
      if (!el || el.contains(event.target)) return
      handler(event)
    }

    document.addEventListener('pointerdown', listener)
    return () => document.removeEventListener('pointerdown', listener)
  }, [ref, handler, active])
}
