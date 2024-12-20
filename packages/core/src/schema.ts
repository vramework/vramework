import { Ajv } from 'ajv'

import addFormats from 'ajv-formats'
import { ValidateFunction } from 'ajv'

import { Logger } from './services/logger.js'
// import { BadRequestError } from './errors/errors.js'
import { getRoutes } from './http/http-route-runner.js'

const ajv = new Ajv({
  removeAdditional: false,
  coerceTypes: true,
})
addFormats.default(ajv as any)

const validators = new Map<string, ValidateFunction>()

/**
 * Retrieves the global schemas map.
 * @returns A map of schemas.
 */
const getSchemas = () => {
  if (!global.vrameworkSchemas) {
    global.vrameworkSchemas = new Map<string, any>()
  }
  return global.vrameworkSchemas
}

/**
 * Retrieves a schema from the schemas map.
 * @returns A schema.
 */
const getSchema = (schemaName: string): any => {
  const schemas = getSchemas()
  const schema = schemas.get(schemaName)
  if (!schema) {
    throw new Error(`Schema not found: ${schemaName}`)
  }
  return schema
}

/**
 * Validate all the schemas have been loaded.
 */
const validateAllSchemasLoaded = (logger: Logger) => {
  const { routesMeta } = getRoutes()

  const missingSchemas: string[] = []

  for (const route of routesMeta) {
    if (!route.input || validators.has(route.input)) {
      continue
    }
    missingSchemas.push(route.input)
  }

  if (missingSchemas.length > 0) {
    logger.error(
      `Error: Failed to load schemas:\n.${missingSchemas.join('\n')}`
    )
    logger.error('\tHave you run the schema generation?')
    logger.error('\tnpx @vramework/cli schemas')
  } else {
    logger.info('All schemas loaded')
  }
}

/**
 * Adds a schema to the global schemas map.
 * @param name - The name of the schema.
 * @param value - The schema value.
 * @ignore
 */
export const addSchema = (name: string, value: any) => {
  getSchemas().set(name, value)
}

/**
 * Loads a schema and compiles it into a validator.
 * @param schema - The name of the schema to load.
 * @param logger - A logger for logging information.
 */
export const loadSchema = (schema: string, logger: Logger): void => {
  // if (!validators.has(schema)) {
  //   logger.debug(`Adding json schema for ${schema}`)
  //   const json = getSchemas().get(schema)
  //   try {
  //     const validator = ajv.compile(json)
  //     validators.set(schema, validator)
  //   } catch (e: any) {
  //     console.error(e.name, schema, json)
  //     throw e
  //   }
  // }
}

/**
 * Loads a schema and compiles it into a validator.
 * @param logger - A logger for logging information.
 */
export const loadAllSchemas = (logger: Logger): void => {
  for (const [name] of getSchemas()) {
    loadSchema(name, logger)
  }
  validateAllSchemasLoaded(logger)
}

/**
 * Validates JSON data against a schema.
 * @param schema - The name of the schema to validate against.
 * @param json - The JSON data to validate.
 * @throws {BadRequestError} If the JSON data is invalid.
 */
export const validateJson = (schema: string, json: unknown): void => {
  // const validator = validators.get(schema)
  // if (validator == null) {
  //   throw `Missing validator for ${schema}`
  // }
  // const result = validator(json)
  // if (!result) {
  //   console.log(
  //     `failed to validate request data against schema '${schema}'`,
  //     json,
  //     validator.errors
  //   )
  //   const errorText = ajv.errorsText(validator.errors)
  //   throw new BadRequestError(errorText)
  // }
}

export const coerceQueryStringToArray = (schemaName: string, data: any) => {
  const schema = getSchema(schemaName)
  for (const key in schema.properties) {
    const property = schema.properties[key]
    if (typeof property === 'boolean') {
      continue
    }
    const type = property.type
    if (typeof type === 'boolean') {
      continue
    }
    if (type === 'array' && typeof data[key] === 'string') {
      data[key] = data[key].split(',')
    }
  }
}
