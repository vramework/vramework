import * as path from 'path'
import { inspectRoutes } from './inspect-routes.js'
import { glob } from 'glob'
import type { VrameworkConfig } from '@vramework/core/types/core.types'

export const extractVrameworkInformation = async ({
  rootDir,
  routeDirectories,
  routesOutputFile,
  packageMappings,
}: VrameworkConfig) => {
  console.time('Introspecting time:')
  const routeFiles = (
    await Promise.all(
      routeDirectories.map((dir) => glob(`${path.join(rootDir, dir)}/**/*.ts`))
    )
  ).flat()
  const outputPath = path.join(rootDir, routesOutputFile)
  const result = await inspectRoutes(outputPath, routeFiles, packageMappings)
  console.timeEnd('Introspecting time:')
  return result
}
