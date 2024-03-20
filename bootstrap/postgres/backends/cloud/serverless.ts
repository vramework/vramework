import { APIGatewayProxyEvent } from "aws-lambda"

import { processCors, processCorsless } from "@vramework/deploy-lambda/dist/lambda"

import { config } from '@vramework-example/functions/src/config'
import { setupServices } from "@vramework-example/functions/src/services"
import { getRoutes } from "@vramework-example/functions/src/routes"

const services = setupServices(config)
const routes = getRoutes()

export const corslessHandler = async (event: APIGatewayProxyEvent) => {
    return await processCorsless(event, routes as any, config, await services)
}
  
export const corsHandler = async (event: APIGatewayProxyEvent) => {
    return await processCors(event, routes as any, config, await services)
}
  