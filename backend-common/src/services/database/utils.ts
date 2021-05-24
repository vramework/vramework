/* eslint-disable quotes */
import { snakeCase } from 'snake-case'

export interface Filters {
  [index: string]: string | number | string[]
}

export const getEscapedFilter = (
  table: string,
  filters: Filters,
  values: Array<string | number> = [],
  ignoreWhere = false,
): { statement: string; values: Array<string | number> } => {
  let statement = ''
  const conditions = []
  const keys = Object.keys(filters)
  const newValues = [...values]
  for (let i = 0; i < keys.length; i++) {
    if (keys[i] === 'limit') {
      continue
    } else {
      let value = filters[keys[i]]
      if (value instanceof Array) {
        value = value.join("','")
        conditions.push(`${table}."${snakeCase(keys[i])}" @> Array['${value}']`)
      } else {
        conditions.push(`${table}."${snakeCase(keys[i])}"=$${values.length + i + 1}`)
        newValues.push(value)
      }
    }
  }

  if (!ignoreWhere) {
    statement += `\nWHERE ${conditions.length === 0 ? 'true' : conditions.join(' AND ')}`
  } else if (conditions.length > 0) {
    statement += `\nAND ${conditions.join(' AND ')}`
  }

  return {
    statement,
    values: newValues,
  } as any
}

export const getEscapedFilterWithSearch = (
  table: string,
  filters: Filters,
  initialValues: Array<string | number> = [],
  pattern?: { search?: string; columns: string[] },
): { statement: string; values: Array<string | number> } => {
  delete filters.query

  if (!pattern || !pattern.search) {
    return getEscapedFilter(table, filters, initialValues, false)
  }

  let filter = ''
  const { statement, values } = getEscapedFilter(table, filters, initialValues, true)
  const columns = pattern.columns.map((col) => `COALESCE(${table}."${snakeCase(col)}"::text, '')`)
  const patternFilter = `${columns.join(' || ')} ILIKE '%${pattern.search}%'`
  filter += `WHERE ${patternFilter} ${statement}`
  return {
    statement: filter,
    values,
  }
}

// This is definately not production usages
export const createBulkInsert = (
  bulk: Record<string, number | string | null | string[] | boolean | undefined | Date>[],
): [string, string, Array<string | number | null | Date>] => {
  let i = 1
  const keys: string[] = []
  const values: string[] = []
  const realValues = bulk.map((data) => {
    Object.keys(data).forEach((key) => {
      if (!keys.includes(key)) {
        keys.push(key)
      }
    })
    values.push(`(${keys.map(() => `$${i++}`).join(',')})`)
    return Object.keys(data).map((k) => data[k]) as Array<string | number | null>
  })
  return [`"${keys.map((k) => snakeCase(k)).join('","')}"`, values.join(','), realValues.reduce((r, v) => [...r, ...v])]
}

export const createInsert = (
  data: Record<string, number | string | null | string[] | undefined | Buffer>,
  offset = 0,
): [string, string, Array<string | number | null>] => {
  const keys = Object.keys(data).filter((k) => data[k] !== undefined)
  const values = keys.map((k, i) => `$${i + 1 + offset}`)
  const realValues = keys.map((k) => data[k]) as Array<string | number | null>
  return [`"${keys.map((k) => snakeCase(k)).join('","')}"`, values.join(','), realValues]
}

// eslint-disable-next-line
export const transformValues = (from: any): Record<string, number | string | null> => {
  return Object.keys(from).reduce((r, k) => {
    const value = from[k]
    if (typeof value === 'number' || typeof value === 'string' || value === null) {
      r[k] = value
    } else if (value instanceof Array && k === 'tags') {
      r[k] = `{ ${value.join(',')}}`
    } else {
      r[k] = JSON.stringify(value)
    }
    return r
  }, {} as Record<string, number | string | null>)
}

export const resultToDictionary = <T extends { id: string }>(data: T[]): Record<string, T> => {
  return data.reduce((r, k) => {
    r[k.id] = k
    return r
  }, {} as Record<string, T>)
}

export const exactlyOneResult = <T>(result: T[], Err: Error): T => {
  if (result.length !== 1) {
    throw Err
  }
  return result[0]
}
