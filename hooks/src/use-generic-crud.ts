import { EntityType } from '@hallomarta/api/types/general'
import { useState, useCallback, useRef } from 'react'
import useAsyncEffect from 'use-async-effect'
import { ChangedDataHook, useChangedData } from './use-changed-data'

export type GenericGetUpdate<Type> = ChangedDataHook<Type> & {
  totalFieldLength: number
  missingFieldsLength: number
  state: 'loading' | 'ready' | 'saving' | 'error' | 'saved'
  saveError: string | null
  refresh: () => Promise<void>
  saveChange: () => Promise<void>
  saveChanges: () => Promise<void>
  hasChange: boolean
  entityType: EntityType
}

export type GenericGet<Type> = {
  data: Type | null
  state: 'loading' | 'error' | 'ready'
  entityType: EntityType | null
}

export const useGenericGet = <Type extends Object>(
  id: string | undefined | null,
  entityType: EntityType | null,
  getRest: Function,
): GenericGet<Type> => {
  const [data, setData] = useState<Type | null>(null)
  const [state, setState] = useState<'loading' | 'ready' | 'error'>('loading')
  useAsyncEffect(
    async (isMounted) => {
      if (id) {
        setState('loading')
        const serverData = await getRest(id)
        if (isMounted()) {
          setData(serverData)
          setState('ready')
        }
      } else {
        setData(null)
        setState('loading')
      }
    },
    [id],
  )
  return {
    entityType,
    state,
    data
  }
}

export const useGenericGetUpdate = <Type extends Object>(
  id: string | undefined,
  entityType: EntityType,
  getRest: Function,
  updateRest: Function | null,
  defaultValues: Partial<Type> = {},
  options?: Partial<{
    minSaveDuration: number
  }>
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

  const refresh = useCallback(async () => {
    const serverData = await getRest(id)
    setOriginal({ ...defaultValues, ...serverData })
  }, [])

  const changed = useChangedData<Type>(original)
  const saveChanges = useCallback(async () => {
    if (!updateRest) {
      throw 'Update function not provided'
    }
    const changedData = changed.changedDataRef.current
    if (Object.keys(changedData).length !== 0) {
      setState('saving')
      try {
        await Promise.all([
          updateRest(id, changedData),
          new Promise(resolve => setTimeout(resolve, options?.minSaveDuration || 250))
        ])
        setOriginal({ ...originalRef.current, ...changedData })
        setState('saved')
        await new Promise(resolve => setTimeout(resolve, options?.minSaveDuration || 250))
        setState('ready')
      } catch (e) {
        await new Promise(resolve => setTimeout(resolve, options?.minSaveDuration || 250))
        setState('error')
        setSaveError(e.message)
        // Logger here to central API LOG
        await new Promise(resolve => setTimeout(resolve, options?.minSaveDuration || 250))
        setState('ready')
        setSaveError(null)
      }
    }
  }, [])

  const totalFieldLength = Object.keys(original).length
  return {
    entityType,
    totalFieldLength,
    missingFieldsLength: Object.values(changed.data).reduce((r: number, v) => (v === null ? ++r : r), 0),
    refresh,
    saveChanges,
    saveChange: saveChanges,
    state,
    saveError,
    hasChange: Object.keys(changed.changedData).length !== 0,
    ...changed,
  }
}

export const useFamilyGenericGetUpdate = <Type extends Object>(
  familyId: string,
  entityType: EntityType,
  id: string,
  getRest: Function,
  updateRest: Function,
): GenericGetUpdate<Type> => {
  const getFamilyRest = useCallback(async () => {
    return await getRest(familyId, id)
  }, [familyId, getRest])
  const updateFamilyRest = useCallback(
    async (id: string, data: any) => {
      return await updateRest(familyId, id, data)
    },
    [familyId, updateRest],
  )
  return useGenericGetUpdate(id, entityType, getFamilyRest, updateFamilyRest)
}
