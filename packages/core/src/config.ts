export interface CoreConfig {
  domain: string
  corsDomains?: string[]
  server: {
    port: number
    maximumComputeTime: number
  }
  content: {
    fileUploadPath: string
    fileSizeLimit: string
  }
  logger: {
    level: string
  }
}
