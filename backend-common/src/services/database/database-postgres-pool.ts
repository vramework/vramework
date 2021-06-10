import * as pg from 'pg'
import { Pool } from 'pg'

// @ts-ignore
import * as pgCamelCase from 'pg-camelcase'
import { Logger } from 'pino'
pgCamelCase.inject(pg)

const types = pg.types
types.setTypeParser(1082, function (stringValue) {
  return stringValue
})

export class DatabasePostgresPool {
  public pool: Pool
  public client!: pg.PoolClient

  constructor(private dbCredentials: any, private logger: Logger) {
    this.logger.info(`Using db host: ${dbCredentials.host}`)
    this.pool = new Pool(dbCredentials)
  }

  public async init() {
    this.client = await this.pool.connect()
    await this.checkConnection()
    await this.client.release()
  }

  public async getClient() {
    return this.pool.connect()
  }

  public async query <T>(statement: string, values?: any[]) {
    return await this.pool.query<T>(statement, values)
  }

  public async close() {
    this.pool.end()
  }

  private async checkConnection(): Promise<void> {
    try {
      const { rows } = await this.client.query<{ serverVersion: string }>('SHOW server_version;')
      this.logger.info(`Postgres server version is: ${rows[0].serverVersion}`)
    } catch (e) {
      console.error(e)
      this.logger.error(`Unable to connect to server with ${this.dbCredentials.host}, exiting server`)
      process.exit(1)
    }
  }

}