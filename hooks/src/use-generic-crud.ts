import { useState, useCallback, useRef } from 'react'
import useAsyncEffect from 'use-async-effect'
import { ChangedDataHook, useChangedData } from './use-changed-data'

export type GenericGetUpdate<Type> = ChangedDataHook<Type> & {
  totalFieldLength: number
  missingFieldsLength: number
  state: 'loading' | 'ready' | 'saving' | 'error' | 'saved'
  saveError: string | null
  saveChange: () => Promise<void>
  saveChanges: () => Promise<void>
  hasChange: boolean
}

export const useGenericGetUpdate = <Type extends Object>(
  id: string | undefined,
  getRest: Function,
  updateRest: Function,
  defaultValues: Partial<Type> = {},
  options?: Partial<{
    minSaveDuration: number
  }>,
): GenericGetUpdate<Type> => {
  const [original, setOriginal] = useState<Type>(defaultValues as Type)
  const originalRef = useRef(original)
  originalRef.current = original
  const [state, setState] = useState<'loading' | 'ready' | 'saving' | 'error' | 'saved'>('loading')
  const [saveError, setSaveError] = useState<string | null>(null)

  useAsyncEffect(
    async (isMounted) => {
      if (id) {
        setState('loading')
        const serverData = await getRest(id)
        if (isMounted()) {
          setOriginal({ ...defaultValues, ...serverData })
          setState('ready')
        }
      }
    },
    [id],
  )

  const changed = useChangedData<Type>(original)
  const saveChanges = useCallback(async () => {
    const changedData = changed.changedDataRef.current
    if (Object.keys(changedData).length !== 0) {
      setState('saving')
      try {
        await Promise.all([
          updateRest(id, changedData),
          new Promise((resolve) => setTimeout(resolve, options?.minSaveDuration || 1000)),
        ])
        setOriginal({ ...originalRef.current, ...changedData })
        setState('saved')
        await new Promise((resolve) => setTimeout(resolve, options?.minSaveDuration || 1000))
        setState('ready')
      } catch (e) {
        await new Promise((resolve) => setTimeout(resolve, options?.minSaveDuration || 1000))
        setState('error')
        setSaveError(e.message)
        // Logger here to central API LOG
        await new Promise((resolve) => setTimeout(resolve, options?.minSaveDuration || 2000))
        setState('ready')
        setSaveError(null)
      }
    }
  }, [])

  const totalFieldLength = Object.keys(original).length
  return {
    totalFieldLength,
    missingFieldsLength: Object.values(changed.data).reduce((r: number, v) => (v === null ? ++r : r), 0),
    saveChanges,
    saveChange: saveChanges,
    state,
    saveError,
    hasChange: Object.keys(changed.changedData).length !== 0,
    ...changed,
  }
}
