export const delay = async (delay: number): Promise<void> => new Promise((resolve) => setTimeout(resolve, delay))

// eslint-disable-next-line @typescript-eslint/no-empty-function
export const VOID_FUNCTION = (): void => { }

// eslint-disable-next-line @typescript-eslint/no-empty-function
export type AsyncVoidFunction = () => Promise<void>
export const ASYNC_VOID_FUNCTION = async (): Promise<void> => { }

export const injectIntoUrl = (route: string, keys: Record<string, string>) => {
    for (const [name, value] of Object.entries(keys)) {
        route = route.replace(`:${name}`, value)
    }
    return route
}

// Pick some fields to be mandatory, everything else is partial
export type PickRequired<T, K extends keyof T> = Pick<T, K> & Partial<T>;
// Pick some fields to be mandatory, everything else is partial
export type PickOptional<T, K extends keyof T> = Omit<T, K> & Partial<T>;