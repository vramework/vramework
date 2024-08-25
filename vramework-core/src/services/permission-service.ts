import { CoreAPIRoute } from "../routes";
import { CoreUserSession } from "../user-session";

export interface PermissionService {
    verifyRouteAccess ({ route }: CoreAPIRoute<unknown, unknown>, session?: CoreUserSession): Promise<void>;
}