import { createGenerator, RootlessError } from 'ts-json-schema-generator'
import { writeFileInDir } from '../utils.js'
import { mkdir, writeFile } from 'fs/promises'
import { JSONValue } from '@vramework/core'
import { HTTPRoutesMeta } from '@vramework/core/http'

export async function generateSchemas(
  tsconfig: string,
  routesMeta: HTTPRoutesMeta,
  customAliasedTypes: Map<string, string>
): Promise<Record<string, JSONValue>> {
  const schemasSet = new Set(customAliasedTypes.keys())
  for (const { input, output, inputTypes } of routesMeta) {
    if (input) {
      schemasSet.add(input)
    }
    if (output) {
      schemasSet.add(output)
    }
    if (inputTypes?.body) {
      schemasSet.add(inputTypes.body)
    }
    if (inputTypes?.query) {
      schemasSet.add(inputTypes.query)
    }
    if (inputTypes?.params) {
      schemasSet.add(inputTypes.params)
    }
  }

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
        console.log('Error generating schema since it has no root:', schema)
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
  routesMeta: HTTPRoutesMeta,
  customAliasedTypes: Map<string, string>,
  supportsImportAttributes: boolean
) {
  await writeFileInDir(
    `${schemaParentDir}/register.ts`,
    'export const empty = null;'
  )

  const desiredSchemas = new Set([
    ...routesMeta
      .map(({ input, output }) => [input, output])
      .flat()
      .filter(
        (s) =>
          !!s &&
          !['boolean', 'string', 'number', 'null', 'undefined'].includes(s)
      ),
    ...customAliasedTypes.keys(),
  ])

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
import * as ${schema} from './schemas/${schema}.schema.json' ${supportsImportAttributes ? `with { type: 'json' }` : ''}
addSchema('${schema}', ${schema})
`
    )
    .join('\n')

  await writeFileInDir(
    `${schemaParentDir}/register.ts`,
    `import { addSchema } from '@vramework/core/schema'\n${schemaImports}`
  )
}
