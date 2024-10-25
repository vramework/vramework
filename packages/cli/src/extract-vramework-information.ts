import * as path from 'path'
import { inspectRoutes } from './inspector/inspect-routes.js'
import { glob } from 'glob'

export const extractVrameworkInformation = async (rootDir: string, routeDirectories: string[]) => {
  console.time('Introspecting time')
  const routeFiles = (
    await Promise.all(
      routeDirectories.map((dir) => glob(`${path.join(rootDir, dir)}/**/*.ts`))
    )
  ).flat()
  const result = await inspectRoutes(routeFiles)
  console.timeEnd('Introspecting time')
  return result
}
