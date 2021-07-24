import { useState, useCallback } from "react"

export function mergeData<T>(original: T, data: Partial<T>): T {
    if (!data) {
      return original
    }
    const result: Partial<T> = {}
    for (const k in original) {
      result[k] = data[k] !== undefined ? data[k] : original[k]
    }
    return result as T
  }

export type AsyncActionStates = 'initial' | 'error' | 'progress' | 'done'
type AsyncFunction = (...args: any[]) => Promise<any>
export const useAsyncAction = <T extends AsyncFunction>(callback: T, { complete, resetTimeout, immediate }: { complete?: Function, resetTimeout?: number, immediate?: VoidFunction } = {}): { error?: Error, state: AsyncActionStates, action: T  } => {
    const [state, setState] = useState<AsyncActionStates>('initial')
    const [error, setError] = useState<Error>()
    const action = useCallback(async (...args: any[]) => {
        setState('progress')
        try {
            const result = await callback(...args)
            immediate && immediate()
            setState('done')
            if (complete) {
                setTimeout(() => {
                    complete(result)
                }, 100)
            }
        } catch (e) {
            console.error(e)
            setError(e)
            setState('error')
        }
        if (resetTimeout) {
            setTimeout(() => {
                setState('initial')
                setError(undefined)
            }, resetTimeout)
        }

    }, [callback, immediate, complete]) as never as T
    return { error, state, action }
}
