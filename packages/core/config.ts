export interface CoreConfig {
  domain: string
  corsDomains?: string[]
  maximumComputeTime?: number
  secrets: {}
  server: {
    port: number
  }
  logger: {
    level: string
  }
}
