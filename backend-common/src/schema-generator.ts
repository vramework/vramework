import { promises } from 'fs'
import { createGenerator } from 'ts-json-schema-generator'
import { getRoutes } from '@samarambi/functions/src/routes'

export async function generateSchemas(tsconfig: string, schemaParentDir: string) {
  const routes = getRoutes()

  const schemasSet = new Set(routes.map<string | null>(({ schema }) => schema).filter((s) => !!s) as string[])
  const schemas = Array.from(schemasSet)

  await promises.mkdir(`${schemaParentDir}/schemas`, { recursive: true })

  const generator = createGenerator({ tsconfig })

  await Promise.all(
    schemas.map(
      async (schema) =>
        await promises.writeFile(
          `${schemaParentDir}/schemas/${schema}.json`,
          JSON.stringify(generator.createSchema(schema)),
          'utf-8',
        ),
    ),
  )

  await promises.writeFile(
    `${schemaParentDir}/schemas.ts`,
    `
import { addSchema } from '@vramework/backend-common/src/schema'
` +
      schemas
        .map(
          (schema) => `
import ${schema} from './schemas/${schema}.json'
addSchema('${schema}', ${schema})`,
        )
        .join('\n'),
    'utf8',
  )
}

