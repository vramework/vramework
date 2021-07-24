import { useRef, useCallback } from 'react'

export const useBouncedCallback = <T extends any[]>(
    callback: (...args: T) => void,
    time = 2000,
  ): ((...args: T) => void) => {
    const lastAttempt = useRef<number>()
    return useCallback(
      (...args) => {
        clearTimeout(lastAttempt.current)
        // DOM and NodeJS timers clashing
        lastAttempt.current = (setTimeout(() => callback(...args), time) as never) as number
      },
      [callback, time],
    )
  }
  