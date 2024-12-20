export interface VariablesService {
    get: (name: string) => Promise<string | undefined> | string | undefined
    getAll: () => Promise<Record<string, string | undefined>> | Record<string, string | undefined>
}