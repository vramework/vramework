import * as pg from 'pg'
import { QueryResult } from 'pg'

import { getValidationErrors } from '@vramework/backend-common/src/schema'
import { snakeCase } from 'snake-case'
import { createFilters, createInsert, exactlyOneResult, sanitizeResult, selectFields } from './database-utils'
import { Logger } from 'pino'
import { DatabasePostgresPool } from './database-postgres-pool'

const types = pg.types
types.setTypeParser(1082, function (stringValue) {
  return stringValue
})

export class DatabasePostgresClient<Table extends string> {
  private client: pg.PoolClient | null = null

  constructor(private pool: DatabasePostgresPool, private logger: Logger, private userId?: string) {
  }

  public async closeSession() {
    if (this.client) {
      this.client.release()
    }
  }

  public async crudGet <T extends object>(table: Table, fields: readonly (keyof T)[], filters: Record<string, any>): Promise<Pick<T, typeof fields[number]>[]> 
  public async crudGet <T extends object>(table: Table, fields: readonly (keyof T)[], filters: Record<string, any>, notSingleError: Error): Promise<Pick<T, typeof fields[number]>> 
  public async crudGet <T extends object>(table: Table, fields: readonly (keyof T)[], filters: Record<string, any>, notSingleError?: undefined | Error): Promise<Pick<T, typeof fields[number]> | Pick<T, typeof fields[number]>[]> {
    const { filter, filterValues } = createFilters({
      filters: Object.entries(filters).map(([field, value], index) => ({ value, field, operator: 'eq', conditionType: index !== 0 ? 'AND' : undefined }))
    })
    const result = await this.query<Pick<T, typeof fields[number]>>(`
      SELECT ${selectFields<T>(fields, table)}
      FROM "app"."${table}"
      ${filter}
    `, filterValues)
    if (notSingleError) {
      const single = exactlyOneResult(result.rows, notSingleError)
      return sanitizeResult(single)
    }
    return result.rows
  }

  public async crudInsert <T extends object>(table: Table, insert: Partial<Record<keyof T, string | number | string[] | Date | null | undefined>>): Promise<void>
  public async crudInsert <T extends object>(table: Table, insert: Partial<Record<keyof T, string | number | string[] | Date | null | undefined>>, returns: readonly (keyof T)[]): Promise<Record<keyof T, any>>
  public async crudInsert <T extends object>(table: Table, insert: Partial<Record<keyof T, string | number | string[] | Date | null | undefined>>, returns?: readonly (keyof T)[]): Promise<void | Record<keyof T, any>> {
    const [keys, values, realValues] = createInsert(insert)
    if (returns) {
      const returnStatement = (returns || []).map(key => snakeCase(key.toString())).join(',')
      const result = await this.query<Pick<T, typeof returns[number]>>(`INSERT INTO "app".${table}(${keys}) VALUES (${values}) RETURNING ${returnStatement};`, realValues)
      return exactlyOneResult(result.rows, new Error())
    } else {
      await this.query(`INSERT INTO "app".${table}(${keys}) VALUES (${values})`, realValues)
    }
  }

  public async crudUpdate <T extends object>(table: Table, update: Partial<Record<keyof T, string | number | string[] | Date | null | undefined>>, filters: Record<string, any>, error?: Error): Promise<void> {
    if (Object.keys(update).length === 0) {
      return
    }
    const { filter, filterValues } = createFilters({
      filters: Object.entries(filters).map(([field, value], index) => ({ value, field, operator: 'eq', conditionType: index !== 0 ? 'AND' : undefined }))
    })
    const [keys, values, realValues] = createInsert(update, filterValues.length)
    const result = await this.query(`
        UPDATE "app".${table}
        SET (${keys}) = row(${values})
        ${filter}
    `, [...filterValues, ...realValues])
    if (result.rowCount !== 1 && error) {
      throw error
    }
  }
  
  public async debugQuery <T = { rows: unknown[] }>(
    statement: string,
    values: Array<string | number | null | Buffer | Date> = [],
    schema?: string
  ): Promise<QueryResult<T>> {
    return await this._query<T>(statement, values, schema, 'debug')
  }

  public async query <T = { rows: unknown[] }>(
    statement: string,
    values: Array<string | number | null | Buffer | Date> = [],
    schema?: string
  ): Promise<QueryResult<T>> {
    return await this._query<T>(statement, values, schema)
  }

  private async _query<T = { rows: unknown[] }>(
    statement: string,
    values: Array<string | number | null | Buffer | Date> = [],
    schema?: string,
    debug?: 'debug',
  ): Promise<QueryResult<T>> {
    statement = statement.replace(/^\s*[\r\n]/gm, '')
    if (debug) {
      this.logger.info(`\nExecuting:\n  Query: ${statement}\n  Values:\n ${values}\n'`)
    }

    if (!this.client) {
      return await this.transaction(async () => this._query(statement, values, schema, debug))
    }

    const start = Date.now()
    return await new Promise<QueryResult<T>>((resolve, reject) => {
      this.client!.query<T>(statement, values, (err, res) => {
        if (err) {
          if (err.message.includes('user_auth_email_key')) {
            this.logger.error(`Error inserting data with duplicated email: ${JSON.stringify(values)}`)
          } else {
            const errorId = Math.random().toString().substr(2)
            console.error(`Error ${errorId} running statement:`, statement, 'with values', JSON.stringify(values))
            this.logger.error(`Error running sql statement ${errorId} ${err.message}`, { errorId })
          }
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
        if (schema && process.env.NODE_ENV !== 'production' && process.env.IGNORE_PG_SCHEMA === undefined) {
          // validate returned rows against schema
          let errors:ReturnType<typeof getValidationErrors>;
          res.rows.forEach(row => {
            errors = getValidationErrors(this.logger as any, schema, row);
            if (errors) {
              this.logger.error(`query result validation failed against type ${schema}`, {row, errors});
            } else if (debug) {
              this.logger.info(`row validates as ${schema}`);
            }
          });
        }
        resolve(res)
      })
    })
  }

  public async transaction<T>(fn:(() => Promise<T>)):Promise<T> {
    if (this.client) {
      return await fn()
    }
    this.client = await this.pool.getClient()
    try {
      await this.query('BEGIN;')
      if (this.userId) {
        await this.query(`SET SESSION "session.user_id" = '${this.userId}'`)
      }
      const result = await fn()
      await this.query('COMMIT;')
      return result;
    } catch (e) {
      await this.query('ROLLBACK')
      throw e
    } finally {
      this.client?.release()
      this.client = null
    }
  }
}