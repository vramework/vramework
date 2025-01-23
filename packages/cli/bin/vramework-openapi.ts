import { Command } from 'commander'
import {
  logCommandInfoAndTime,
  logVrameworkLogo,
  VrameworkCLIOptions,
  writeFileInDir,
} from '../src/utils.js'
import { generateSchemas } from '../src/schema/schema-generator.js'
import { generateOpenAPISpec } from '../src/openapi/openapi-spec-generator.js'
import {
  getVrameworkCLIConfig,
  VrameworkCLIConfig,
} from '../src/vramework-cli-config.js'
import { InspectorState } from '@vramework/inspector'
import { stringify } from 'yaml'
import { inspectorGlob } from '../src/inspector-glob.js'

export const vrameworkOpenAPI = async (
  { tsconfig, openAPI }: VrameworkCLIConfig,
  { http }: InspectorState
) => {
  await logCommandInfoAndTime(
    'Creating OpenAPI spec',
    'Created OpenAPI spec',
    [openAPI?.outputFile === undefined, 'openAPI outfile is not defined'],
    async () => {
      if (!openAPI?.outputFile) {
        throw new Error('openAPI is required')
      }
      const schemas = await generateSchemas(
        tsconfig,
        http.typesMap,
        http.meta,
      )
      const openAPISpec = await generateOpenAPISpec(
        http.meta,
        schemas,
        openAPI.additionalInfo
      )
      if (openAPI.outputFile.endsWith('.json')) {
        await writeFileInDir(
          openAPI.outputFile,
          JSON.stringify(openAPISpec, null, 2),
          true
        )
      } else if (
        openAPI.outputFile.endsWith('.yaml') ||
        openAPI.outputFile.endsWith('.yml')
      ) {
        await writeFileInDir(openAPI.outputFile, stringify(openAPISpec), true)
      }
    }
  )
}

async function action({ config }: VrameworkCLIOptions): Promise<void> {
  logVrameworkLogo()
  const cliConfig = await getVrameworkCLIConfig(config, [
    'rootDir',
    'routesFile',
    'openAPI',
    'schemaDirectory',
    'tsconfig',
  ])
  const visitState = await inspectorGlob(
    cliConfig.rootDir,
    cliConfig.routeDirectories
  )
  await vrameworkOpenAPI(cliConfig, visitState)
}

export const openapi = (program: Command): void => {
  program
    .command('openapi')
    .description('Generate an openapi spec')
    .option('-c | --config <string>', 'The path to vramework cli config file')
    .action(action)
}
