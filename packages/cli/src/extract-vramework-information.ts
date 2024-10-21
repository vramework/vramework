import * as path from 'path'
import { inspectRoutes } from './inspect-routes.js'
import { glob } from 'glob'
import type { VrameworkCLIConfig } from '@vramework/core/types/core.types'

export const extractVrameworkInformation = async ({
  rootDir,
  routeDirectories,
  routesOutputFile,
  packageMappings,
}: VrameworkCLIConfig) => {
  console.time('introspecting')
  const routeFiles = (
    await Promise.all(
      routeDirectories.map((dir) => glob(`${path.join(rootDir, dir)}/**/*.ts`))
    )
  ).flat()
  const outputPath = path.join(rootDir, routesOutputFile)
  const result = await inspectRoutes(outputPath, routeFiles, packageMappings)
  console.timeEnd('introspecting')
  return result
}
