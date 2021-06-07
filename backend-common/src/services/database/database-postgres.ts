import pg from 'pg'
import { QueryResult } from 'pg'
import { Logger } from 'pino'
import { snakeCase } from 'snake-case'

// @ts-ignore
import { inject } from 'pg-camelcase'
import { DatabasePostgresPool } from './database-postgres-pool'
import { createFilters, createInsert, exactlyOneResult, selectFields } from './database-utils'
inject(pg)

export class DatabasePostgres<Tables extends string> {
  private client!: pg.PoolClient

  constructor(private pool: DatabasePostgresPool, private logger: Logger) {
  }

  public async close () {
    if (this.client) {
      await this.client.release()
    }
  }

  public async crudGet <T extends object>(table: Tables, fields: readonly (keyof T)[], filters: Record<string, any>): Promise<Pick<T, typeof fields[number]>[]> 
  public async crudGet <T extends object>(table: Tables, fields: readonly (keyof T)[], filters: Record<string, any>, notSingleError: Error): Promise<Pick<T, typeof fields[number]>> 
  public async crudGet <T extends object>(table: Tables, fields: readonly (keyof T)[], filters: Record<string, any>, notSingleError?: undefined | Error): Promise<Pick<T, typeof fields[number]> | Pick<T, typeof fields[number]>[]> {
    const { filter, filterValues } = createFilters({
    filters: Object.entries(filters).map(([field, value]) => ({ value, field, operator: 'eq' }))
    })
    const result = await this.query<Pick<T, typeof fields[number]>>(`
      SELECT ${selectFields<T>(fields, table)}
      FROM "app"."${table}"
      ${filter}
    `, filterValues)
    if (notSingleError) {
      return exactlyOneResult(result.rows, notSingleError)
    }
    return result.rows
  }

  public async crudInsert <T extends object>(table: Tables, insert: Partial<Record<keyof T, string | number | string[] | Date | null | undefined>>): Promise<void>
  public async crudInsert <T extends object>(table: Tables, insert: Partial<Record<keyof T, string | number | string[] | Date | null | undefined>>, returns: readonly (keyof T)[]): Promise<Record<keyof T, any>>
  public async crudInsert <T extends object>(table: Tables, insert: Partial<Record<keyof T, string | number | string[] | Date | null | undefined>>, returns?: readonly (keyof T)[]): Promise<void | Record<keyof T, any>> {
    const [keys, values, realValues] = createInsert(insert)
    if (returns) {
      const returnStatement = (returns || []).map(key => snakeCase(key.toString())).join(',')
      const result = await this.query<Pick<T, typeof returns[number]>>(`INSERT INTO "app".${table}(${keys}) VALUES (${values}) RETURNING ${returnStatement};`, realValues)
      return exactlyOneResult(result.rows, new Error())
    } else {
      await this.query(`INSERT INTO "app".${table}(${keys}) VALUES (${values})`, realValues)
    }
  }

  public async crudUpdate <T extends object>(table: Tables, update: Partial<Record<keyof T, string | number | string[] | Date | null | undefined>>, filters: Record<string, any>, error: Error): Promise<void> {
    const { filter, filterValues } = createFilters({
      filters: Object.entries(filters).map(([field, value]) => ({ value, field, operator: 'eq' }))
    })
    const [keys, values, realValues] = createInsert(update, filterValues.length)
    const result = await this.query(`
        UPDATE "app".${table}
        SET (${keys}) = row(${values})
        ${filter}
    `, [...filterValues, ...realValues])
    if (result.rowCount !== 1) {
      throw error
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
    } finally {
      this.client.release()
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
