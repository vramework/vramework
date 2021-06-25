import EventEmitter from 'eventemitter3'
import { useEffect } from 'react'

export const useServiceHook = (service: EventEmitter, event: string, callback: (...args: any[]) => void) => {
  useEffect(() => {
    service.on(event, callback)
    return () => {
      service.off(event, callback)
    }
  }, [service, event, callback])
}
