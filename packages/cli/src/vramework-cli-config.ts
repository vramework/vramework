import { join, dirname, resolve } from 'path'
import { readdir } from 'fs/promises'
import { OpenAPISpecInfo } from './openapi-spec-generator.js'

export interface VrameworkCLICoreOutputFiles {
  outDir?: string
  routesFile: string
  schemaDirectory: string
  typesDeclarationFile: string
  routesMapDeclarationFile: string
  bootstrapFile: string
}

export type VrameworkCLIConfig = {
  $schema?: string

  extends?: string

  rootDir: string
  routeDirectories: string[]
  packageMappings: Record<string, string>

  configDir: string
  tsconfig: string

  nextDeclarationFile?: string
  fetchFile?: string

  openAPI?: {
    outputFile: string
    additionalInfo: OpenAPISpecInfo
  }
} & VrameworkCLICoreOutputFiles

export const getVrameworkCLIConfig = async (
  configFile: string | undefined = undefined,
  requiredFields: Array<keyof VrameworkCLIConfig>,
  exitProcess: boolean = false
): Promise<VrameworkCLIConfig> => {
  if (!configFile) {
    let execDirectory = process.cwd()
    const files = await readdir(execDirectory)
    const file = files.find((file) =>
      /vramework\.config\.(ts|js|json)$/.test(file)
    )
    if (!file) {
      const errorMessage =
        '\nConfig file vramework.config.json not found\nExiting...'
      if (exitProcess) {
        console.error(errorMessage)
        process.exit(1)
      }
      throw new Error(errorMessage)
    }
    configFile = join(execDirectory, file)
  }

  try {
    let result: VrameworkCLIConfig
    const config: VrameworkCLIConfig = await import(configFile)
    const configDir = dirname(configFile)
    if (config.extends) {
      const extendedConfig = await getVrameworkCLIConfig(
        resolve(configDir, config.extends),
        [],
        exitProcess
      )
      result = {
        ...extendedConfig,
        ...config,
        configDir,
        packageMappings: {
          ...extendedConfig.packageMappings,
          ...config.packageMappings,
        },
      }
    } else {
      result = {
        ...config,
        configDir,
        packageMappings: config.packageMappings || {},
        rootDir: config.rootDir
          ? resolve(configDir, config.rootDir)
          : configDir,
      }
    }

    if (result.outDir) {
      if (!result.schemaDirectory) {
        result.schemaDirectory = join(result.outDir, 'vramework-schemas')
      }
      if (!result.routesFile) {
        result.routesFile = join(result.outDir, 'vramework-routes.ts')
      }
      if (!result.typesDeclarationFile) {
        result.typesDeclarationFile = join(
          result.outDir,
          'vramework-types.d.ts'
        )
      }
      if (!result.routesMapDeclarationFile) {
        result.routesMapDeclarationFile = join(
          result.outDir,
          'vramework-routes-map.d.ts'
        )
      }
      if (!result.bootstrapFile) {
        result.bootstrapFile = join(result.outDir, 'vramework-bootstrap.ts')
      }
    }

    if (requiredFields.length > 0) {
      validateCLIConfig(result, requiredFields)
    }

    for (const objectKey of Object.keys(result)) {
      if (objectKey.endsWith('File') || objectKey.endsWith('Directory')) {
        const relativeTo =
          objectKey === 'nextDeclarationFile'
            ? result.configDir
            : result.rootDir
        if (result[objectKey]) {
          result[objectKey] = join(relativeTo, result[objectKey])
        }
      }
    }

    result.tsconfig = join(result.rootDir, result.tsconfig)

    return result
  } catch (e: any) {
    console.error(e)
    console.error(`Config file not found: ${configFile}`)
    process.exit(1)
  }
}

export const validateCLIConfig = (
  cliConfig: VrameworkCLIConfig,
  required: Array<keyof VrameworkCLIConfig>
) => {
  let errors: string[] = []
  for (const key of required) {
    if (!cliConfig[key]) {
      errors.push(key)
    }
  }

  if (errors.length > 0) {
    console.error(
      `${errors.join(', ')} ${errors.length === 1 ? 'is' : 'are'} required in vramework.config.json`
    )
    process.exit(1)
  }
}
