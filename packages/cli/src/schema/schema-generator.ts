import { createGenerator, RootlessError } from 'ts-json-schema-generator'
import { writeFileInDir } from '../utils.js'
import { mkdir, writeFile } from 'fs/promises'
import { JSONValue } from '@vramework/core'
import { HTTPFunctionsMeta } from '@vramework/core/http'

export async function generateSchemas(
  tsconfig: string,
  routesMeta: HTTPFunctionsMeta
): Promise<Record<string, JSONValue>> {
  const schemasSet = new Set(
    routesMeta
      .map<Array<string | undefined | null>>(
        ({ input, output, inputTypes }) => [
          input,
          output,
          inputTypes?.body,
          inputTypes?.query,
          inputTypes?.params,
        ]
      )
      .flat()
      .filter((s) => !!s) as string[]
  )

  const generator = createGenerator({
    tsconfig,
    skipTypeCheck: true,
    topRef: false,
    discriminatorType: 'open-api',
  })
  const schemas: Record<string, JSONValue> = {}
  schemasSet.forEach((schema) => {
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

  return schemas
}

export async function saveSchemas(
  schemaParentDir: string,
  schemas: Record<string, JSONValue>,
  routesMeta: HTTPFunctionsMeta
) {
  await writeFileInDir(
    `${schemaParentDir}/register.ts`,
    'export const empty = null;'
  )

  const desiredSchemas = new Set(
    routesMeta
      .map(({ input, output }) => [input, output])
      .flat()
      .filter((s) => !!s && !['boolean', 'string', 'number'].includes(s))
  )

  if (desiredSchemas.size === 0) {
    console.log(`\x1b[34m• Skipping schemas since none found.\x1b[0m`)
    return
  }

  await mkdir(`${schemaParentDir}/schemas`, { recursive: true })
  await Promise.all(
    Object.entries(schemas).map(async ([schemaName, schema]) => {
      if (desiredSchemas.has(schemaName)) {
        await writeFile(
          `${schemaParentDir}/schemas/${schemaName}.schema.json`,
          JSON.stringify(schema),
          'utf-8'
        )
      }
    })
  )

  const schemaImports = Array.from(desiredSchemas)
    .map(
      (schema) => `
import * as ${schema} from './schemas/${schema}.schema.json'
addSchema('${schema}', ${schema})
`
    )
    .join('\n')

  await writeFileInDir(
    `${schemaParentDir}/register.ts`,
    `import { addSchema } from '@vramework/core/schema'\n${schemaImports}`
  )
}
