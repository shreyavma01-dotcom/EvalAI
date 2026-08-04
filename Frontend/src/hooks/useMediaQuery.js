import { useEffect, useState } from 'react'

/**
 * Reactive matchMedia hook.
 * @param {string} query e.g. '(min-width: 64rem)'
 */
export function useMediaQuery(query) {
  const [matches, setMatches] = useState(() =>
    typeof window !== 'undefined' ? window.matchMedia(query).matches : false,
  )

  useEffect(() => {
    const mql = window.matchMedia(query)
    const onChange = (event) => setMatches(event.matches)
    setMatches(mql.matches)
    mql.addEventListener('change', onChange)
    return () => mql.removeEventListener('change', onChange)
  }, [query])

  return matches
}

export const useIsDesktop = () => useMediaQuery('(min-width: 64rem)')
export const useIsMobile = () => useMediaQuery('(max-width: 63.98rem)')
