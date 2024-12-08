import { JSONSchema7 } from 'json-schema'

declare global {
  var schemas: Map<string, JSONSchema7> | undefined
  var errors: Map<string, ErrorConstructor> | undefined
}

export {}
