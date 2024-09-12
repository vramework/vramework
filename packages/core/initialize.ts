import { join } from "path"

import { loadAPIFiles } from "./api-routes"
import { loadSchemas } from "./schema"
import { CoreAPIRoutes } from "./routes"
import { VrameworkConfig } from "./types"

export const initializeVrameworkCore = async (config: VrameworkConfig): Promise<{ routes: CoreAPIRoutes }> => {
  await loadSchemas(
    join(config.rootDir, config.schemaOutputDirectory)
  )
  const routes = await loadAPIFiles(
    config.rootDir,
    config.routeDirectories
  )
  return { routes }
}