import { useEffect } from 'react'

/**
 * Invoke a handler when Escape is pressed.
 * @param {(event: KeyboardEvent) => void} handler
 * @param {boolean} enabled
 */
export function useEscapeKey(handler, enabled = true) {
  useEffect(() => {
    if (!enabled) return undefined

    const listener = (event) => {
      if (event.key === 'Escape') handler(event)
    }

    document.addEventListener('keydown', listener)
    return () => document.removeEventListener('keydown', listener)
  }, [handler, enabled])
}
