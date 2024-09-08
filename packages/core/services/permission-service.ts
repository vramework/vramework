import { CoreAPIRoute } from "../routes";
import { CoreUserSession } from "../types";

export interface PermissionService {
    verifyRouteAccess ({ route }: CoreAPIRoute<unknown, unknown>, session?: CoreUserSession): Promise<void>;
}