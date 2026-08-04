import { useEffect } from 'react'

/**
 * Locks body scroll while `locked` is true (modal/drawer/command palette).
 */
export function useLockBodyScroll(locked = true) {
  useEffect(() => {
    if (!locked) return undefined
    const original = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      document.body.style.overflow = original
    }
  }, [locked])
}
