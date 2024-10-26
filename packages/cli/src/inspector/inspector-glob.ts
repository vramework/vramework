import * as path from 'path'
import { glob } from 'glob'
import { inspector } from './inspector.js'
import { logCommandInfoAndTime } from '../utils.js'
import { VisitState } from './visit.js'

export const inspectorGlob = async (rootDir: string, routeDirectories: string[]) => {
  let result: VisitState
  await logCommandInfoAndTime('Inspecting codebase', 'Inspected codebase', async () => {
    const routeFiles = (
      await Promise.all(
        routeDirectories.map((dir) => glob(`${path.join(rootDir, dir)}/**/*.ts`))
      )
    ).flat()
    result = await inspector(routeFiles)
  })
  return result!
}
