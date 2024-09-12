import { CoreServices, CoreSingletonServices, CoreUserSession } from "@vramework/core/types";
import { Response, Request } from 'express-serve-static-core'

export type CreateExpressHTTPSessionServices = <Req = Request, Res = Response>(services: CoreSingletonServices, session: CoreUserSession, data: { req: Req, res: Res }) => Promise<CoreServices>