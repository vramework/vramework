import { promises } from 'fs'
import { CoreAPIRoute, CoreAPIRoutes } from './types/routes.types.js'
import { join, resolve } from 'path'
import { readFile } from 'fs/promises'

const importFile = async (path: string) => {
  return await import(path)
}

/**
 * Verifies that there are no duplicate routes in the provided array of routes.
 * @param routes - An array of CoreAPIRoute objects to verify.
 * @throws {Error} If a duplicate route is found.
 */
export const verifyRoutes = (
  routes: Array<CoreAPIRoute<unknown, unknown, any>>
) => {
  const typedRoutes = new Map()
  for (const type of ['get', 'patch', 'delete', 'post', 'head']) {
    typedRoutes.set(type, new Set<string[]>())
  }

  routes.forEach((route) => {
    const paths = typedRoutes.get(route.method)
    const normalizedRoute = route.route.replace(/:[^/]+/g, ':param')
    if (paths.has(normalizedRoute)) {
      throw new Error(`Duplicate route: ${JSON.stringify(route)}`)
    }
    paths.add(normalizedRoute)
  })
}

/**
 * Recursively loads all API file paths from the specified directory.
 * @param relativeRootDir - The directory to load API file paths from.
 * @param routeDirectories - An array of directories within the root directory to look in.
 * @returns A promise that resolves to an array of file paths containing API routes.
 */
export const loadRoutes = async (
  relativeRootDir: string,
  routeDirectories: string[] = []
): Promise<string[]> => {
  let filesWithRoutes: string[] = []

  for (const routeDirectory of routeDirectories) {
    const files = await loadRoutesFromDirectory(
      join(`${relativeRootDir}/${routeDirectory}`)
    )
    filesWithRoutes = [...filesWithRoutes, ...files]
  }

  return filesWithRoutes
}

/**
 * Recursively loads API routes from the specified directory.
 * @param relativeRootDir - The root directory to load routes from.
 * @param apiRoutes - An array to store the loaded API routes.
 * @param filesWithRoutes - An array to store the file paths that contain routes.
 * @returns A promise that resolves to an object containing the file paths with routes.
 */
export const loadRoutesFromDirectory = async (
  relativeRootDir: string,
  apiRoutes: CoreAPIRoutes = [],
  filesWithRoutes: string[] = []
): Promise<string[]> => {
  const entries = await promises.readdir(relativeRootDir)

  await Promise.all(
    entries.map(async (entry) => {
      if (relativeRootDir.includes('node_modules')) {
        return
      }
      const lstat = await promises.lstat(`${relativeRootDir}/${entry}`)
      if (lstat.isDirectory()) {
        await loadRoutesFromDirectory(
          `${relativeRootDir}/${entry}`,
          apiRoutes,
          filesWithRoutes
        )
      } else {
        if (
          entry.endsWith('.ts') &&
          !entry.endsWith('.d.ts') &&
          !entry.endsWith('.test.ts')
        ) {
          const content = await readFile(`${relativeRootDir}/${entry}`)
          if (content.includes('addRoute')) {
            await importFile(`${relativeRootDir}/${entry}`)
            filesWithRoutes.push(resolve(relativeRootDir, entry))
          }
        }
      }
    })
  )

  return filesWithRoutes
}
