import { VrameworkRequest } from '@vramework/core/vramework-request'
import { APIGatewayProxyEvent } from 'aws-lambda'

export class VrameworkLambdaRequest extends VrameworkRequest {
    constructor(protected event: APIGatewayProxyEvent) {
        super()
    }

    public getPath() {
        return this.event.path
    }

    public getMethod() {
        return this.event.httpMethod.toLowerCase() as "post" | "get" | "delete" | "patch" | "head" | "options"
    }

    public getBody() {
        throw new Error('Method not implemented.')
    }

    public getHeader(headerName: string): string | undefined {
        throw new Error('Method not implemented.')
    }

}