import * as path from 'path'
import { glob } from 'glob'
import { InspectorState, inspect } from '@pikku/inspector'
import { logCommandInfoAndTime } from './utils.js'

export const inspectorGlob = async (
  rootDir: string,
  routeDirectories: string[]
) => {
  let result: InspectorState
  await logCommandInfoAndTime(
    'Inspecting codebase',
    'Inspected codebase',
    [false],
    async () => {
      const routeFiles = (
        await Promise.all(
          routeDirectories.map((dir) =>
            glob(`${path.join(rootDir, dir)}/**/*.ts`)
          )
        )
      ).flat()
      result = await inspect(routeFiles)
    }
  )
  return result!
}
