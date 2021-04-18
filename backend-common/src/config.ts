export interface CoreConfig {
  domain: string
  authFlag: {
    required: boolean
    value: string
  }
  server: {
    port: number
  }
  postgres: {
    user: string
    host: string
    password: string
    port?: number
    database: string
    schema: string
  }
  secrets: {
    cloudfrontContentId: string
    cloudfrontContentPrivateKey: string
  }
  cookie: {
    name: string
  },
  slack: {
    hooks: {
      error: string | null
    }
  }
}

