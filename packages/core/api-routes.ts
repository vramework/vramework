import { promises } from 'fs';
import { CoreAPIRoutes } from './routes';
import { join } from 'path';

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
  filesWithRoutes: string[],
  apiRoutes: CoreAPIRoutes
}> => {
  let filesWithRoutes: string[] = [];
  let apiRoutes: CoreAPIRoutes = [];

  for (const routeDirectory of routeDirectories) {
    const { apiRoutes: routes, filesWithRoutes: files } = await loadRoutesFromDirectory(
      join(`${relativeRootDir}/${routeDirectory}`)
    );
    filesWithRoutes = [...filesWithRoutes, ...files]
    apiRoutes = [...apiRoutes, ...routes];
  }

  return { apiRoutes, filesWithRoutes }
};


export const loadRoutesFromDirectory = async (
  relativeRootDir: string,
  filesWithRoutes: string[] = []
): Promise<{
  filesWithRoutes: string[],
  apiRoutes: CoreAPIRoutes
}> => {
  let apiRoutes: CoreAPIRoutes = [];

  const entries = await promises.readdir(relativeRootDir);

  await Promise.all(
    entries.map(async (entry) => {
      if (relativeRootDir.includes('node_modules')) {
        return;
      }
      const lstat = await promises.lstat(`${relativeRootDir}/${entry}`);
      if (lstat.isDirectory()) {
        await loadRoutesFromDirectory(`${relativeRootDir}/${entry}`, filesWithRoutes);
      } else {
        if (
          entry.endsWith('.ts') &&
          !entry.endsWith('.d.ts') &&
          !entry.endsWith('.test.ts')
        ) {
          const routes = await import(`${relativeRootDir}/${entry}`)
          if (routes.routes) {
            filesWithRoutes.push(`${relativeRootDir}/${entry}`);
            apiRoutes = [...apiRoutes, ...routes.routes];
          }
        }
      }
    })
  );

  return { apiRoutes, filesWithRoutes }
};
