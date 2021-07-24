import { useEffect } from 'react'

export const useWindowClicked = (callback: (e: MouseEvent) => void, enabled = true): void => {
    useEffect(() => {
      if (enabled) {
        setTimeout(() => window.addEventListener('click', callback))
      }
      return () => {
        enabled && window.removeEventListener('click', callback)
      }
    }, [callback, enabled])
  }