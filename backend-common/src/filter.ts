export type FilterSubExpressions = {
  conditionType?: 'AND' | 'OR',
  filter?: string
  expressions?: FilterSubExpressions[]
  field?: string
  operator?: 'eq' | 'ne' | 'lt' | 'lte' | 'gt' | 'gte' | 'contains' | 'after' | 'on' | 'before' | 'includes' | 'excludes'
  value?: string | number | Date
}

export type FilterExpression = FilterSubExpressions[]

export interface SortField {
  key: string
  order: 'asc' | 'desc'
}

export interface BulkFilter {
  freeText?: string
  filters?: FilterExpression
  sort?: SortField
  limit?: number
  offset?: number
}