import { migrate } from "postgres-migrations"
import pino from 'pino'
import { config } from '@vramework-example/functions/src/config'

const migrateUp = async () => {
    const logger = pino()
    logger.level = 'error'

    migrate(config.postgres, `${__dirname}/../sql`)
}

migrateUp()