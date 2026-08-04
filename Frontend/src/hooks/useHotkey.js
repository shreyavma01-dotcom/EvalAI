import { useEffect } from 'react'

/**
 * Register a keyboard shortcut.
 * @param {string} key e.g. 'k'
 * @param {(event: KeyboardEvent) => void} handler
 * @param {object} [options]
 * @param {boolean} [options.ctrl]
 * @param {boolean} [options.shift]
 * @param {boolean} [options.alt]
 * @param {boolean} [options.enabled]
 */
export function useHotkey(key, handler, { ctrl = false, shift = false, alt = false, enabled = true } = {}) {
  useEffect(() => {
    if (!enabled) return undefined

    const listener = (event) => {
      const metaKey = event.ctrlKey || event.metaKey
      if (ctrl && !metaKey) return
      if (!ctrl && metaKey) return
      if (shift && !event.shiftKey) return
      if (!shift && event.shiftKey) return
      if (alt && !event.altKey) return
      if (!alt && event.altKey) return
      if (event.key.toLowerCase() !== key.toLowerCase()) return
      event.preventDefault()
      handler(event)
    }

    document.addEventListener('keydown', listener)
    return () => document.removeEventListener('keydown', listener)
  }, [key, handler, ctrl, shift, alt, enabled])
}
