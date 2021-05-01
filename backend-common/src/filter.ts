export type Filter = {
    field: string,
    operator: 'contains' | 'eq' | 'ne',
    value: string,
}

export interface BulkFilter {
  limit?: number,
  offset?: number
  sort?: {
    key: string
    order: 'asc' | 'desc'
  },
  filters: Filter[]
}