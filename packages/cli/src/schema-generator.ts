import { createGenerator } from 'ts-json-schema-generator'
import { writeFileInDir } from './utils.js'
import { mkdir, writeFile } from 'fs/promises'

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
  await mkdir(`${schemaParentDir}/schemas`, { recursive: true })
  await Promise.all(
    schemas.map(async (schema) => {
      await writeFile(
        `${schemaParentDir}/schemas/${schema}.schema.json`,
        JSON.stringify(generator.createSchema(schema)),
        'utf-8'
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
