import { RoutesMeta } from '@vramework/core'

export const serializeMetaInputTypes = (
  routesMeta: RoutesMeta,
  metaTypes: Map<string, string>
) => {
  const result = routesMeta.map(({ inputTypes }) => {
    if (!inputTypes) {
      return
    }

    return Object.values(inputTypes)
      .filter((inputType) => !!inputType)
      .map((name) => `export type ${name} = ${metaTypes.get(name)}`)
      .join('\n')
  })

  return result.filter((r) => !!r).join('\n\n')
}
