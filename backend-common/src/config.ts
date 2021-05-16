export interface CoreConfig {
  domain: string
  server: {
    port: number
  }
  cookie: {
    name: string
  }
  files: {
    directory: string
  }
}
