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