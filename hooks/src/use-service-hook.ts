import EventEmitter from 'eventemitter3'
import { useEffect } from 'react'

export const useServiceHook = (service: EventEmitter, event: string, callback: (...args: any[]) => void) => {
  return useEffect(() => {
    service.once(event, callback)
    return () => {
      service.off(event, callback)
    }
  }, [event, callback])
}
