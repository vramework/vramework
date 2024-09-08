import { CoreServices, CoreSingletonServices, CoreUserSession } from "@vramework/core/types";

export type CreateExpressHTTPSessionServices = <Req = Express.Request, Res = Express.Request>(services: CoreSingletonServices, session: CoreUserSession, data: { req: Req, res: Res }) => Promise<CoreServices>