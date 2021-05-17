import { ConnectionParams, createDb, migrate } from 'postgres-migrations'
import pg from 'pg'

export async function postgresMigrate(sqlDirectory: string, dbConfig: ConnectionParams & { database: string; defaultDatabase: string }, dropSchemas: boolean = false) {
  try {
    await createDb(dbConfig.database, dbConfig)

    const client = new pg.Pool(dbConfig)

    if (dropSchemas) {
      if (process.env.NODE_ENV === 'production' || dbConfig.host !== 'localhost') {
        throw 'Cant drop schemas when in production mode or database host not local =)'
      }
      await client.query('SHOW server_version;')
      await client.query(`DROP TABLE IF EXISTS public.migrations;`)
      await client.query(`DROP SCHEMA IF EXISTS app CASCADE;`)
    }

    await migrate({ client }, sqlDirectory, { logger: undefined })
  } catch (e) {
    console.error(e)
    process.exit(1)
  }
}
