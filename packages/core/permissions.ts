import { NotPermissionedError } from './errors'
import { CoreAPIPermission } from './routes'
import { CoreServices, CoreUserSession } from './types'

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

  throw new NotPermissionedError()
}
