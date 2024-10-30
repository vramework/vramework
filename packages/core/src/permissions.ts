import { ForbiddenError } from './errors.js'
import { CoreAPIPermission } from './types/routes.types.js'
import { CoreServices, CoreUserSession } from './types/core.types.js'

/**
 * This function validates permissions by iterating over permission groups and executing the corresponding permission functions. If all functions in at least one group return true, the permission is considered valid.
 * @param services - The core services required for permission validation.
 * @param data - The data to be used in the permission validation functions.
 * @param session - An optional user session for permission validation.
 * @returns A promise that resolves to void.
 */
export const verifyPermissions = async (
  permissions: Record<
    string,
    CoreAPIPermission<any>[] | CoreAPIPermission<any>
  >,
  services: CoreServices,
  data: any,
  session?: CoreUserSession
): Promise<void> => {
  let valid = false
  const permissionGroups = Object.values(permissions)
  if (permissionGroups.length === 0) {
    return
  }

  for (const funcs of permissionGroups) {
    if (funcs instanceof Array) {
      const permissioned = await Promise.all(
        funcs.map((func) => func(services, data, session))
      )
      if (permissioned.every((result) => result)) {
        valid = true
      }
    } else {
      valid = await funcs(services, data, session)
    }
    if (valid) {
      return
    }
  }

  throw new ForbiddenError()
}
