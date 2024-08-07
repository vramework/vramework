export type Operator = 'eq' | 'ne' | 'lt' | 'lte' | 'gt' | 'gte' | 'contains' | 'after' | 'on' | 'before' | 'includes' | 'excludes' | 'exists'

export type FilterSubExpressions = {
  conditionType?: 'AND' | 'OR',
  filter?: string
  expressions?: FilterSubExpressions[]
  field?: string
  operator?: Operator
  value?: string | number | Date | boolean
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