export interface CoreConfig {
  awsRegion: string
  domain: string
  secrets: {
    postgresCredentials: string
  }
  content: {
    localFileUploadPath: string
  }
  server: {
    port: number
  }
  cookie: {
    name: string
  }
  files: {
    directory: string
  },
  sql: {
    database: string
    directory: string
  },
  logger: {
    level: string
  }
}
