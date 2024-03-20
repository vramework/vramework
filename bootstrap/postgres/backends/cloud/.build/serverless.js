"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.corsHandler = exports.corslessHandler = void 0;
const lambda_1 = require("@vramework/deploy-lambda/dist/lambda");
const config_1 = require("@vramework-example/functions/src/config");
const services_1 = require("@vramework-example/functions/src/services");
const routes_1 = require("@vramework-example/functions/src/routes");
const services = (0, services_1.setupServices)(config_1.config);
const routes = (0, routes_1.getRoutes)();
const corslessHandler = async (event) => {
    return await (0, lambda_1.processCorsless)(event, routes, config_1.config, await services);
};
exports.corslessHandler = corslessHandler;
const corsHandler = async (event) => {
    return await (0, lambda_1.processCors)(event, routes, config_1.config, await services);
};
exports.corsHandler = corsHandler;
//# sourceMappingURL=serverless.js.map