import * as AjvImp from 'ajv'
const Ajv = 'default' in AjvImp ? AjvImp.default : AjvImp as any

import addFormats from 'ajv-formats'
import { ValidateFunction } from 'ajv'

import { Logger } from './services/logger.js'
import { InvalidParametersError } from './errors.js'

const ajv = new Ajv({
  removeAdditional: false,
  coerceTypes: false,
})
addFormats.default(ajv as any)

const validators = new Map<string, ValidateFunction>()

/**
 * Retrieves the global schemas map.
 * @returns A map of schemas.
 */
const getSchemas = () => {
  // @ts-ignore
  if (!global.schemas) {
    // @ts-ignore
    global.schemas = new Map<string, any>()
  }
  // @ts-ignore
  return global.schemas
}

/**
 * Loads schemas from the specified directory.
 * @param schemaDir - The directory to load schemas from.
 */
export const loadSchemas = async (schemaDir: string) => {
  try {
    await import(`${schemaDir}/schemas.ts`)
  } catch {
    console.error('Error: Failed to load schemas.')
    console.error('\tHave you run the schema generation?')
    console.error('\tnpx @vramework/cli schemas')
  }
}

/**
 * Adds a schema to the global schemas map.
 * @param name - The name of the schema.
 * @param value - The schema value.
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
  if (!validators.has(schema)) {
    logger.debug(`Adding json schema for ${schema}`)
    const json = getSchemas().get(schema)
    try {
      const validator = ajv.compile(json)
      validators.set(schema, validator)
    } catch (e: any) {
      console.error(e.name, schema, json)
      throw e
    }
  }
}

/**
 * Validates JSON data against a schema.
 * @param schema - The name of the schema to validate against.
 * @param json - The JSON data to validate.
 * @throws {InvalidParametersError} If the JSON data is invalid.
 */
export const validateJson = (schema: string, json: unknown): void => {
  const validator = validators.get(schema)
  if (validator == null) {
    throw `Missing validator for ${schema}`
  }
  const result = validator(json)
  if (!result) {
    console.log(
      `failed to validate request data against schema '${schema}'`,
      json,
      validator.errors
    )
    const errorText = ajv.errorsText(validator.errors)
    throw new InvalidParametersError(errorText)
  }
}
