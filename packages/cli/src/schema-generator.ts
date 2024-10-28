import { createGenerator, RootlessError } from 'ts-json-schema-generator'
import { writeFileInDir } from './utils.js'
import { mkdir, writeFile } from 'fs/promises'
import { JSONValue, RoutesMeta } from '@vramework/core'

export async function generateSchemas (tsconfig: string, routesMeta: RoutesMeta, filter: 'input' | 'output' | 'both' = 'input'): Promise<Record<string, JSONValue>> {
  const schemasSet = new Set(
    routesMeta
      .map<[string | undefined | null, string | undefined | null]>(({ input, output }) => [filter !== 'output' ? input : undefined, filter !== 'input' ? output : undefined])
      .flat()
      .filter(s => !!s) as string[]
  )

  const generator = createGenerator({ tsconfig, skipTypeCheck: true, topRef: false })
  const schemas: Record<string, JSONValue> = {}
  await Promise.all(
    Array.from(schemasSet).map(async (schema) => {
      try {
        schemas[schema] = generator.createSchema(schema) as JSONValue        
      } catch (e) {
        // Ignore rootless errors
        if (e instanceof RootlessError) {
          return
        }
        throw e
      }
    })
  )
  return schemas
}

export async function generateAndSaveSchemas(
  schemaParentDir: string,
  schemas: Record<string, JSONValue>
) {
  await writeFileInDir(
    `${schemaParentDir}/register.ts`,
    'export const empty = null;',
  )

  await mkdir(`${schemaParentDir}/schemas`, { recursive: true })
  await Promise.all(
    Object.entries(schemas).map(async ([schemaName, schema]) => {
      await writeFile(
        `${schemaParentDir}/schemas/${schemaName}.schema.json`,
        JSON.stringify(schema),
        'utf-8'
      )
    })
  )

  await writeFileInDir(
    `${schemaParentDir}/register.ts`,
    `
import { addSchema } from '@vramework/core'
` +
    Object.keys(schemas)
      .map(
        (schema) => `
import * as ${schema} from './schemas/${schema}.schema.json'
addSchema('${schema}', ${schema})`
      )
      .join('\n')
  )
}
