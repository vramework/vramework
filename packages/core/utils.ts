import { RequestHeaders } from "./types"

export const getHeader = (headers: RequestHeaders, name: string): string | undefined => {
    let value: string | string[] | undefined
    if (typeof headers === 'function') {
        value = headers(name)
    } else {
        value = headers[name]
    }
    if (value instanceof Array) {
        throw new Error('Array header values not yet supported')
    }
    return value
}

export const mergeData = (
    params: Record<string, any>, 
    query: Record<string, any>, 
    body: Record<string, any>
) => {
    return {
        ...(params || {}),
        ...(query || {}),
        ...(body || {}),
    }
}