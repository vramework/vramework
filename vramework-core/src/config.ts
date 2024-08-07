export interface ContentConfig {
  localFileUploadPath: string
  bucketName: string
  endpoint?: string
  region?: string
}

export interface CoreConfig {
  awsRegion: string
  domain: string
  corsDomains?: string[]
  maximumComputeTime?: number
  secrets: {
    postgresCredentials: string
    cloudfrontContentId: string
    cloudfrontContentPrivateKey: string
  }
  content: ContentConfig
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
