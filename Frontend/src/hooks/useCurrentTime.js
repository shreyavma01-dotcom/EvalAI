import { useEffect, useState } from 'react'

/**
 * Live clock. Re-renders every `interval` ms (default 1s).
 * @returns {Date}
 */
export function useCurrentTime(interval = 1000) {
  const [now, setNow] = useState(() => new Date())

  useEffect(() => {
    const id = window.setInterval(() => setNow(new Date()), interval)
    return () => window.clearInterval(id)
  }, [interval])

  return now
}
