import { getRoutes } from '@vramework-example/functions/src/routes'
import { generateSchemas } from '@vramework/core/dist/schema-generator'

generateSchemas(`${__dirname}/../backends/cloud/tsconfig.json`, `${__dirname}/../packages/functions/generated`, getRoutes() as any)