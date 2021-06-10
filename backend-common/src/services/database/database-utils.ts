/* eslint-disable quotes */
import { snakeCase } from 'snake-case'
import { FilterExpression, BulkFilter, FilterSubExpressions } from '../../filter'

export interface Filters {
  [index: string]: string | number | string[]
}

export const createFields = <TABLE>(fields: Array<keyof TABLE>, table?: string) => {
  const r = fields.reduce((r, field) => {
    r.push(`'${field}'`)
    if (table) {
      r.push(`"${table}".${snakeCase(field as string)}`)
    } else {
      r.push(snakeCase(field as string))
    }
    return r
  }, [] as string[])
  return r.join(',')
}

export const selectFields = <TABLE>(fields: readonly (keyof TABLE)[], table: string) => {
  if (fields.length === 0) {
    return '*'
  }
  const r = fields.reduce((r, field) => {
    r.push(`"${table}".${snakeCase(field as string)}`)
    return r
  }, [] as string[])
  return r.join(',')
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
  data: Record<string, number | string | null | string[] | undefined | Date>,
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

export const exactlyOneResult = <T>(result: T[], Err: Error): T => {
  if (result.length !== 1) {
    throw Err
  }
  return result[0]
}

const operatorToPostgres: Record<string, string> = {
  'gt': '>',
  'gte': '>=',
  'lt': '<',
  'lte': '<=',
  'eq': '=',
  'ne': '!=',
  'on': '=',
  'after': '>',
  'before': '<'
}

const manageFilters = (expressions: FilterExpression): Array<any> => {
  return expressions.reduce((result, expression) => {
    if (expression.conditionType) {
      result.push({ conditionType: expression.conditionType })
    }
    if (expression.expressions) {
      return [...result, { grouping: '(' }, ...manageFilters(expression.expressions), { grouping: ')' }]
    } else {
      const { field, value, operator } = expression
      const parts = field!.split('.')
      if (parts.length === 1) {
        result.push({ operator, field, value })
      } else {
        let table = parts[0].replace(/s$/, '')
        const actualField = parts.pop() as string
        result.push({ table, operator, field: actualField, value })
      }
    }
    return result
  }, [] as any[])
}

export const createFilters = (data: BulkFilter, freeTextFields: string[] = [], includeWhere: boolean = true, valueOffset: number = 0) => {
  const limit = data.limit || 1000
  const offset = data.offset || 0

  let sort: string = ''
  if (data.sort) {
    const parts = data.sort.key.split('.')
    let table = ''
    if (parts.length > 1) {
      // TODO: This logic should be in client.
      table = `"${parts[0]}".`
    }
    const field = parts.pop() as string
    sort = `ORDER BY ${table}${snakeCase(field)} ${data.sort.order}`
  }

  let cleanFilters = manageFilters(data.filters || [])
  if (data.freeText && data.freeText.trim()) {
    const freeTextFilters = freeTextFields.map<FilterSubExpressions>((field, index) => ({ conditionType: index === 0 ? undefined : 'OR', field, operator: 'contains', value: data.freeText! }))
    let filters: FilterExpression = []
    if (data.filters && data.filters.length > 0) {
      filters = data.filters
    }
    cleanFilters = manageFilters([...filters, { conditionType: data.filters?.length ? 'AND' : undefined, expressions: freeTextFilters }])
  } else {
    cleanFilters = manageFilters(data.filters || [])
  }

  const filterValues: any[] = []
  let filter: string = ''
  if (cleanFilters && cleanFilters.length > 0) {
    const filters = cleanFilters.map(({ grouping, conditionType = '', operator, table, field, value }) => {
      if (grouping) {
        return grouping
      }

      if (conditionType && field === undefined) {
        return conditionType
      }

      const t = table ? `"${table}".` : ''
      const column = `${t}"${snakeCase(field)}"`

      if (operator === 'contains') {
        if ((value as string).trim()) {
          filterValues.push((value as string).trim().split(' ').reduce((result, value) => {
            if (value) {
              result.push(`${value}:*`)
            }
            return result
          }, [] as string[]).join(' | '))
          return `${conditionType} ${column} @@ to_tsquery('simple', $${valueOffset + filterValues.length})`
        }
        return undefined
      }

      if (operator === 'includes' || operator === 'excludes') {
        filterValues.push(value)
        return `${conditionType} $${valueOffset + filterValues.length} ${operator === 'includes' ? '=' : '!='} ANY (${t}"${snakeCase(field)}")`
      }

      if (operatorToPostgres[operator]) {
        filterValues.push(value)
        return `${conditionType} ${column} ${operatorToPostgres[operator]} $${valueOffset + filterValues.length}`
      }

      if (conditionType) {
        return conditionType
      }

      return undefined
    }).filter(v => !!v)

    if (filters.length > 0) {
      filter = `${includeWhere ? 'WHERE ' : ''}${filters.join(' ')}`
    }
  }

  return { limit, offset, sort, filter, filterValues }
}

export const sanitizeResult = <T>(object: Record<string, any>): T => {
  return Object.entries(object).reduce((result, [key, value]) => {
    if (typeof value === 'string' && /^{.*}$/.test(value)) {
      const entries = value.substring(1, value.length - 1)
      result[key] = entries.split(',').filter(v => !!v && v !== 'NULL')
    } else {
      result[key] = value
    }
    return result
  }, {} as any)
}
