import pg, { QueryResult } from 'pg'
import { Pool } from 'pg'
import { Logger } from 'pino'
import { DatabasePostgres } from './database-postgres'

export class DatabasePostgresPool {
  public pool: Pool

  constructor(private config: pg.PoolConfig, private logger: Logger) {
    this.logger.info(`Using db host: ${config.host}`)
    this.pool = new Pool(config)
  }

  public async init (): Promise<void> {
    await this.checkConnection()
  }

  public async getClient (): Promise<pg.PoolClient> {
    return await this.pool.connect()
  }

  public async query<T = { rows: unknown[] }>(
    statement: string,
    values: Array<string | number | null | Buffer | Date> = [],
  ): Promise<QueryResult<T>> {
    const client = new DatabasePostgres(this, this.logger)
    const result = await client.query<T>(statement, values)
    await client.close()
    return result
  }

  private async checkConnection(): Promise<void> {
    try {
      const { rows } = await this.query<{ serverVersion: string }>('SHOW server_version;')
      this.logger.info(`Postgres server version is: ${rows[0].serverVersion}`)
    } catch (e) {
      console.error(e)
      this.logger.error(`Unable to connect to server with ${this.config.host}, exiting server`)
      process.exit(1)
    }
  }
}
