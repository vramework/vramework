import { NotPermissionedError } from "./errors";
import { CoreAPIPermission } from "./routes";
import { CoreServices } from "./services";
import { CoreUserSession } from "./user-session";

export const verifyPermissions = async (permissions: Record<string, CoreAPIPermission<any>[]>, services: CoreServices, data: any, session?: CoreUserSession): Promise<{ valid: boolean, details: Record<string, boolean>}> => {
    const perms =  Object.entries(permissions)

    let valid = false
    const details = perms.reduce((results, [key]) => {
        results[key] = false
        return results
    }, {} as Record<string, boolean>)

    for (const [name, funcs] of Object.entries(permissions)) {
        const permissioned = await Promise.all(funcs.map(func => func(services, data, session)))
        if (permissioned.every(result => result)) {
            details[name] = true
            valid = true
        }
    }

    if (!valid) {
        throw new NotPermissionedError()
    }
}
