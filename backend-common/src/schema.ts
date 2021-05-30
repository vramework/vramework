import Ajv, { ValidateFunction } from 'ajv'
import addFormats from 'ajv-formats'
import { InvalidParametersError } from './errors'
import { Logger as PinoLogger } from 'pino'

const ajv = new Ajv({ removeAdditional: false })
addFormats(ajv as any)

const validators = new Map<string, ValidateFunction>()

const schemas = new Map<string, any>()

export const addSchema = (name: string, value: any) => schemas.set(name, value)

export const loadSchema = (schema: string, logger: PinoLogger): void => {
  if (!validators.has(schema)) {
    logger.debug(`Adding json schema for ${schema}`)
    const json = schemas.get(schema)
    try {
      const validator = ajv.compile(json)
      validators.set(schema, validator)
    } catch (e) {
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
    const errorText = ajv.errorsText(validator.errors)
    throw new InvalidParametersError(errorText)
  }
}

export const getValidationErrors = (logger: PinoLogger, schema: string, json: unknown) => {
  const validator = validators.get(schema)
  if (!validator) {
    throw `Missing validator for ${schema}`
  }
  const result = validator(json);
  return result ? undefined : validator.errors;
}
