export interface CoreConfig {
  awsRegion: string
  domain: string
  corsDomains?: string[]
  maximumComputeTime: number
  secrets: {
    postgresCredentials: string
    cloudfrontContentId: string
    cloudfrontContentPrivateKey: string
  }
  content: {
    localFileUploadPath: string
  }
  server: {
    port: number
  }
  sql: {
    database: string
    directory: string
  },
  logger: {
    level: string
  }
}
