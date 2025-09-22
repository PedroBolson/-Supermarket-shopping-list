import { useEffect, useState } from 'react'

export function useMediaQuery(query: string) {
  const getMatches = () => {
    if (typeof window === 'undefined') {
      return false
    }

    return window.matchMedia(query).matches
  }

  const [matches, setMatches] = useState(getMatches)

  useEffect(() => {
    const mediaQueryList = window.matchMedia(query)

    const listener = (event: MediaQueryListEvent) => {
      setMatches(event.matches)
    }

    if (mediaQueryList.addEventListener) {
      mediaQueryList.addEventListener('change', listener)
    } else {
      // Safari < 14
      mediaQueryList.addListener(listener)
    }

    setMatches(mediaQueryList.matches)

    return () => {
      if (mediaQueryList.removeEventListener) {
        mediaQueryList.removeEventListener('change', listener)
      } else {
        mediaQueryList.removeListener(listener)
      }
    }
  }, [query])

  return matches
}
