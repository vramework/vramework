import { Pool, PoolConfig } from 'pg'
import { Kysely, PostgresDialect } from 'kysely'
import { DB } from 'kysely-codegen'

export class KyselyDatabase {
  public db!: Kysely<DB>

  constructor(private config: PoolConfig) {

  }

  public init() {
    const dialect = new PostgresDialect({
      pool: new Pool(this.config)
    })

    // Database interface is passed to Kysely's constructor, and from now on, Kysely 
    // knows your database structure.
    // Dialect is passed to Kysely's constructor, and from now on, Kysely knows how 
    // to communicate with your database.
    this.db = new Kysely<DB>({
      dialect,
    })
  }
}
