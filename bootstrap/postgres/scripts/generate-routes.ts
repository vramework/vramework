import { generateRoutesImports } from '@vramework/core/dist/routes-generator'

generateRoutesImports(
    `${__dirname}/../packages/functions/src/routes`,
    `${__dirname}/../packages/functions/src/routes.ts`
)