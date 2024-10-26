import { createGenerator } from 'ts-json-schema-generator'
import { writeFileInDir } from './utils.js'

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

  await writeFileInDir(
    `${schemaParentDir}/schemas.ts`,
    'export const empty = null;',
  )

  const generator = createGenerator({ tsconfig, skipTypeCheck: true})
  await Promise.all(
    schemas.map(async (schema) => {
      await writeFileInDir(
        `${schemaParentDir}/schemas/${schema}.schema.json`,
        JSON.stringify(generator.createSchema(schema)),
      )
    })
  )

  await writeFileInDir(
    `${schemaParentDir}/schemas.ts`,
    `
import { addSchema } from '@vramework/core'
` +
    schemas
      .map(
        (schema) => `
import * as ${schema} from './schemas/${schema}.schema.json'
addSchema('${schema}', ${schema})`
      )
      .join('\n')
  )
}
