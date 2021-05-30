import pg from 'pg'
import { Pool, QueryResult } from 'pg'
import { Logger } from 'pino'

// @ts-ignore
import { inject } from 'pg-camelcase'
inject(pg)

export class DatabasePostgres {
  public pool: Pool
  public client!: pg.PoolClient

  constructor(private config: pg.PoolConfig, private logger: Logger) {
    this.logger.info(`Using db host: ${config.host}`)
    this.pool = new Pool(config)
  }

  public async init (): Promise<void> {
    this.client = await  this.pool.connect()
    await this.checkConnection()
  }

  public async transaction<T> (callback: () => Promise<T>): Promise<T> {
    try {
      await this.query('BEGIN;')
      const result = await callback()
      await this.query('COMMIT;')
      return result
    } catch (e) {
      await this.query('ROLLBACK;')
      throw e
    }
  }

  public async query<T = { rows: unknown[] }>(
    statement: string,
    values: Array<string | number | null | Buffer | Date> = [],
    debug?: 'debug',
  ): Promise<QueryResult<T>> {
    statement = statement.replace(/^\s*[\r\n]/gm, '')
    if (debug) {
      this.logger.info(`\nExecuting:\n  Query: ${statement}\n  Values:\n ${values}\n'`)
    }
    const start = Date.now()
    return new Promise<QueryResult<T>>((resolve, reject) => {
      this.pool.query<T>(statement, values, (err, res) => {
        if (err) {
          console.error(err, statement, values)
          reject(err)
          return
        }

        if (debug) {
          const duration = Date.now() - start
          this.logger.info(
            `executed query ${JSON.stringify({
              statement,
              duration,
              rows: res.rowCount,
            })}`,
          )
        }

        resolve(res)
      })
    })
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
