import { RoutesMeta } from "@vramework/core"

export const serializeMetaInputTypes = (routesMeta: RoutesMeta) => {
  const result = routesMeta.map(({ inputTypes }) => {
    if (!inputTypes) {
      return
    }

    return Object.values(inputTypes)
      .filter(inputType => !!inputType)
      .map(({ name, type }) => `export type ${name} = ${type}`)
      .join('\n')
  })

  return result.filter(r => !!r).join('\n\n')
}
