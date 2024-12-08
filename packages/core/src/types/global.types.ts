import type { JSONSchema7 } from 'json-schema'

declare global {
  var vrameworkSchemas: Map<string, JSONSchema7> | undefined
}
