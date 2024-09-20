import { promises } from 'fs'
import { CoreAPIRoute, CoreAPIRoutes } from './routes'
import { join } from 'path'

/**
 * Verifies that there are no duplicate routes in the provided array of routes.
 * @param routes - An array of CoreAPIRoute objects to verify.
 * @throws {Error} If a duplicate route is found.
 * @description This function checks for duplicate routes in the provided array of routes. It throws an error if any duplicate routes are found.
 */
export const verifyRoutes = (routes: Array<CoreAPIRoute<unknown, unknown>>) => {
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

export const importFile = async (path: string) => {
  return await import(path)
}

/**
 * Recursively loads all API file paths from the specified directory.
 * @param dir - The directory to load API file paths from.
 * @param filesWithRoutes - An array to store the file paths.
 * @returns A promise that resolves to an array of file paths containing API routes.
 * @description This function recursively traverses the specified directory, loading all TypeScript file paths that contain API routes.
 */
export const loadRoutes = async (
  relativeRootDir: string,
  routeDirectories: string[] = []
): Promise<{
  filesWithRoutes: string[]
  apiRoutes: CoreAPIRoutes
}> => {
  let filesWithRoutes: string[] = []
  let apiRoutes: CoreAPIRoutes = []

  for (const routeDirectory of routeDirectories) {
    const { apiRoutes: routes, filesWithRoutes: files } =
      await loadRoutesFromDirectory(
        join(`${relativeRootDir}/${routeDirectory}`)
      )
    filesWithRoutes = [...filesWithRoutes, ...files]
    apiRoutes = [...apiRoutes, ...routes]
  }

  verifyRoutes(apiRoutes)

  return { apiRoutes, filesWithRoutes }
}

/**
 * Recursively loads API routes from the specified directory.
 * @param relativeRootDir - The root directory to load routes from.
 * @param apiRoutes - An array to store the loaded API routes.
 * @param filesWithRoutes - An array to store the file paths that contain routes.
 * @returns A promise that resolves to an object containing the loaded API routes and file paths.
 * @description This function recursively traverses the specified directory, loading all TypeScript file paths that contain API routes. It imports the routes from each file and aggregates them into the provided arrays.
 */
export const loadRoutesFromDirectory = async (
  relativeRootDir: string,
  apiRoutes: CoreAPIRoutes = [],
  filesWithRoutes: string[] = []
): Promise<{
  filesWithRoutes: string[]
  apiRoutes: CoreAPIRoutes
}> => {
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
          const routes = await importFile(`${relativeRootDir}/${entry}`)
          if (routes.routes) {
            filesWithRoutes.push(`${relativeRootDir}/${entry}`)
            for (const route of routes.routes) {
              apiRoutes.push(route)
            }
          }
        }
      }
    })
  )

  return { apiRoutes, filesWithRoutes }
}
