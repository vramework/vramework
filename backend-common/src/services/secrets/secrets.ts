import { PoolConfig } from 'pg'

export interface SecretService {
    getPostgresCredentials: () => Promise<PoolConfig>
    getSecret: (secretName: string ) => Promise<string>
}