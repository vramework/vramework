import Ajv, { ValidateFunction } from 'ajv'
import addFormats from 'ajv-formats'
import { InvalidParametersError } from './errors'
import { Logger } from './services/logger'

const ajv = new Ajv({ 
  removeAdditional: false,
  coerceTypes: false 
})
addFormats(ajv as any)

const validators = new Map<string, ValidateFunction>()

const getSchemas = () => {
  // @ts-ignore
  if (!global.schemas) {
    // @ts-ignore
    global.schemas = new Map<string, any>()
  }
  // @ts-ignore
  return global.schemas
}

export const loadSchemas = async (schemaDir: string) => {
  try {
    await import(`${schemaDir}/schemas.ts`)
  } catch (e) {
    console.error('Failed to load schemas', e)
  }
}

export const addSchema = (name: string, value: any) => {
  getSchemas().set(name, value)
}

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

export const validateJson = (schema: string, json: unknown): void => {
  const validator = validators.get(schema)
  if (validator == null) {
    throw `Missing validator for ${schema}`
  }
  const result = validator(json)
  if (!result) {
    console.log(`failed to validate request data against schema '${schema}'`, json, validator.errors)
    const errorText = ajv.errorsText(validator.errors)
    throw new InvalidParametersError(errorText)
  }
}

export const getValidationErrors = (logger: Logger, schema: string, json: unknown) => {
  const validator = validators.get(schema)
  if (!validator) {
    throw `Missing validator for ${schema}`
  }
  const result = validator(json);
  return result ? undefined : validator.errors;
}
