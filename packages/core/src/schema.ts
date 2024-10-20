import { Logger } from './services'
import Ajv, { ValidateFunction } from 'ajv'
import addFormats from 'ajv-formats'
import { InvalidParametersError } from './errors'

const ajv = new Ajv({
  removeAdditional: false,
  coerceTypes: false,
})
addFormats(ajv as any)

const validators = new Map<string, ValidateFunction>()

/**
 * Retrieves the global schemas map.
 * @returns A map of schemas.
 * @description This function retrieves the global schemas map, initializing it if it doesn't exist.
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
 * @description This function attempts to load schemas from the specified directory. If it fails, it logs an error message.
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
 * @description This function adds a schema to the global schemas map.
 */
export const addSchema = (name: string, value: any) => {
  getSchemas().set(name, value)
}

/**
 * Loads a schema and compiles it into a validator.
 * @param schema - The name of the schema to load.
 * @param logger - A logger for logging information.
 * @description This function loads a schema by name, compiles it into a validator, and stores the validator in the validators map.
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
 * @description This function validates JSON data against the specified schema. If the data is invalid, it throws an InvalidParametersError.
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
