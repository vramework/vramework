import path = require('path')
import { inspectRoutes } from './inspect-routes.js'
import { glob } from 'glob'
import { VrameworkCLIConfig } from '@vramework/core/types/core.types'

export const extractVrameworkInformation = async ({
  rootDir,
  routeDirectories,
  routesOutputFile,
  packageMappings,
}: VrameworkCLIConfig) => {
  const routeFiles = (
    await Promise.all(
      routeDirectories.map((dir) => glob(`${path.join(rootDir, dir)}/**/*.ts`))
    )
  ).flat()
  const outputPath = path.join(rootDir, routesOutputFile)
  return await inspectRoutes(outputPath, routeFiles, packageMappings)
}
