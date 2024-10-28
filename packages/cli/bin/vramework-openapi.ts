

import { Command } from 'commander'
import { logCommandInfoAndTime, logVrameworkLogo, VrameworkCLIOptions, writeFileInDir } from '../src/utils.js'
import { generateSchemas } from '../src/schema-generator.js'
import { generateOpenAPISpec } from '../src/openapi-spec-generator.js'
import { VisitState } from '../src/inspector/visit.js'
import { getVrameworkCLIConfig, VrameworkCLIConfig } from '../src/vramework-cli-config.js'
import { inspectorGlob } from '../src/inspector/inspector-glob.js'

export const vrameworkOpenAPI = async ({ tsconfig, openAPI }: VrameworkCLIConfig, { routesMeta }: VisitState) => {
    await logCommandInfoAndTime('Creating OpenAPI spec', 'Created OpenAPI spec', async () => {
        if (!openAPI?.outputFile) {
            throw new Error('openAPI is required')
        }
        const schemas = await generateSchemas(tsconfig, routesMeta, 'both')
        const openAPISpec = await generateOpenAPISpec(routesMeta, schemas, openAPI.additionalInfo)
        await writeFileInDir(openAPI.outputFile, JSON.stringify(openAPISpec, null, 2), true)
    })
}

async function action({ config }: VrameworkCLIOptions): Promise<void> {
    logVrameworkLogo()
    const cliConfig = await getVrameworkCLIConfig(config, ['rootDir', 'routesFile', 'openAPI', 'schemaDirectory', 'tsconfig'])
    const visitState = await inspectorGlob(cliConfig.rootDir, cliConfig.routeDirectories)
    await vrameworkOpenAPI(cliConfig, visitState)
}

export const openapi = (program: Command): void => {
    program
        .command('openapi')
        .description('Generate an openapi spec')
        .option('-c | --config <string>', 'The path to vramework cli config file')
        .action(action)
}
