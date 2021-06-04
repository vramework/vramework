import pg from 'pg'
import { QueryResult } from 'pg'
import { Logger } from 'pino'

// @ts-ignore
import { inject } from 'pg-camelcase'
import { DatabasePostgresPool } from './database-postgres-pool'
inject(pg)

export class DatabasePostgres {
  private client!: pg.PoolClient

  constructor(private pool: DatabasePostgresPool, private logger: Logger) {
  }

  public async close () {
    if (this.client) {
      await this.client.release()
    }
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
    if (!this.client) {
      this.client = await this.pool.getClient()
    }
    statement = statement.replace(/^\s*[\r\n]/gm, '')
    if (debug) {
      this.logger.info(`\nExecuting:\n  Query: ${statement}\n  Values:\n ${values}\n'`)
    }
    const start = Date.now()
    return new Promise<QueryResult<T>>((resolve, reject) => {
      this.client.query<T>(statement, values, (err, res) => {
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
}
