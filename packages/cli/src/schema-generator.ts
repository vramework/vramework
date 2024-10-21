import { promises } from 'fs'
import { createGenerator } from 'ts-json-schema-generator'

export async function generateSchemas(
  tsconfig: string,
  schemaParentDir: string,
  routesMeta: Array<{
    route: string
    method: string
    input: string | null
    output: string | null
  }>
) {
  const schemasSet = new Set(
    routesMeta
      .map<string | undefined | null>(({ input }) => input)
      .filter((s) => !!s) as string[]
  )
  const schemas = Array.from(schemasSet)

  await promises.mkdir(`${schemaParentDir}/schemas`, { recursive: true })
  await promises.writeFile(
    `${schemaParentDir}/schemas.ts`,
    'export const empty = null;',
    'utf-8'
  )

  const generator = createGenerator({ tsconfig })
  await Promise.all(
    schemas.map(async (schema) => {
      await promises.writeFile(
        `${schemaParentDir}/schemas/${schema}.schema.json`,
        JSON.stringify(generator.createSchema(schema)),
        'utf-8'
      )
    })
  )

  await promises.writeFile(
    `${schemaParentDir}/schemas.ts`,
    `
import { addSchema } from '@vramework/core'
` +
      schemas
        .map(
          (schema) => `
import ${schema} from './schemas/${schema}.schema.json'
addSchema('${schema}', ${schema})`
        )
        .join('\n'),
    'utf8'
  )
}
