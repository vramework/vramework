import { runRoute } from "@vramework/core";
import { VrameworkTestRequest } from "./vramework-test-request";
import { VrameworkTestResponse } from "./vramework-test-response";
import { CoreUserSession } from "@vramework/core/types";


export class VrameworkTest {
    constructor (session: CoreUserSession) {

    }

    public async create (route: string, data: any) {

    }

    public async patch (route: string, data: any) {

    }

    public async update (route: string, data: any) {

    }

    public async del (route: string, data: any) {

    }

    public runRoute (route: string, type: string, data: any) {
        const request = new VrameworkTestRequest()
        const response = new VrameworkTestResponse()
        try {
            const data = runRoute(
                request,
                response,
                this.singletonServices,
                this.createSessionServices,
                { route, type },
                data
            )
        } catch (e) {

        }
    }
}