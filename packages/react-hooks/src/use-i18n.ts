import { createContext, useContext } from 'react'

export type GetI18n = (key: string, variables?: Record<string, any>) => string

export const I18nContext = createContext<{ get: GetI18n }>({
  get: (key: string) => `$_${key}_$`,
})

export const useI18n = () => {
    return useContext(I18nContext)
}