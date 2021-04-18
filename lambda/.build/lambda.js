"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.processCors = exports.processCorsless = void 0;
const path_to_regexp_1 = require("path-to-regexp");
const pino_1 = __importDefault(require("pino"));
const cookie_1 = require("cookie");
const schema_1 = require("@vramework/backend-common/src/schema");
const errors_1 = require("@vramework/backend-common/src/errors");
const logger = pino_1.default();
const validateOrigin = (config, services, event) => {
    const origin = event.headers.origin;
    if (!origin || !origin.includes(config.domain)) {
        services.logger.error(`
CORS Error
  - Recieved from origin: ${origin}
  - Expected domain: ${config.domain}
  - Host: ${event.headers.host}
  - Path: ${event.path}
  - Headers: ${JSON.stringify(event.headers, null, '\t')}
`);
        throw new errors_1.InvalidOriginError();
    }
    return origin;
};
const errorHandler = (e, headers) => {
    const errorResponse = errors_1.getErrorResponse(e.constructor);
    let statusCode;
    if (errorResponse) {
        statusCode = errorResponse.status;
        logger.warn(e);
        return {
            headers,
            statusCode,
            body: JSON.stringify({ error: errorResponse.message }),
        };
    }
    return {
        headers,
        statusCode: 500,
        body: JSON.stringify({}),
    };
};
const getMatchingRoute = (services, requestType, requestPath, routes) => {
    let matchedPath = undefined;
    for (const route of routes) {
        if (route.type !== requestType.toLowerCase()) {
            continue;
        }
        const matchFunc = path_to_regexp_1.match(`/${route.route}`, { decode: decodeURIComponent });
        matchedPath = matchFunc(requestPath);
        if (matchedPath) {
            if (route.schema) {
                schema_1.loadSchema(route.schema, services.logger);
            }
            return { matchedPath, route };
        }
    }
    logger.info({ message: 'Invalid route', requestPath, requestType });
    throw new errors_1.NotFoundError();
};
const generalHandler = async (config, services, routes, event, headers) => {
    var _a;
    if (event.httpMethod.toLowerCase() === 'options') {
        return {
            headers: {
                ...headers,
                'Access-Control-Allow-Headers': 'Content-Type,X-Amz-Date,Authorization,X-Api-Key,X-Amz-Security-Token,X-Amz-User-Agent',
                'Access-Control-Allow-Methods': 'OPTIONS,DELETE,GET,HEAD,PATCH,POST,PUT',
            },
            statusCode: 200,
            body: '{}',
        };
    }
    if (event.path.includes('health-check')) {
        return {
            headers,
            statusCode: 200,
            body: '{}',
        };
    }
    if (event.path.includes('logout')) {
        return {
            statusCode: 200,
            body: '{}',
            headers: {
                ...headers,
                'Set-Cookie': cookie_1.serialize(config.cookie.name, 'invalid', {
                    expires: new Date(0),
                    domain: config.domain,
                    path: '/',
                    httpOnly: true,
                    secure: true,
                }),
            },
        };
    }
    try {
        const { matchedPath, route } = getMatchingRoute(services, event.httpMethod, event.path, routes);
        logger.info({ action: 'Executing route', path: matchedPath, route });
        const session = await services.jwt.getUserSession(route.requiresSession === false ? false : true, config.cookie.name, event.headers.cookie);
        let data = { ...matchedPath.params, ...event.queryStringParameters };
        if (((_a = event.headers['Content-Type']) === null || _a === void 0 ? void 0 : _a.includes('application/json')) && event.body) {
            return {
                statusCode: 200,
                body: JSON.stringify({ message: 'error.content_type_json_only' }),
            };
        }
        else {
            data = { ...data, ...JSON.parse(event.body || '{}') };
        }
        services.permissions.validate(config, logger, route, data, session);
        if (route.schema) {
            schema_1.validateJson(route.schema, data);
        }
        const result = await route.func(services, {
            session,
            data,
            config,
        });
        if (result && result.jwt) {
            headers['Set-Cookie'] = cookie_1.serialize(config.cookie.name, result.jwt, {
                domain: config.domain,
                path: '/',
                httpOnly: true,
                secure: true,
                maxAge: 60 * 60 * 24 * 1,
            });
        }
        return {
            statusCode: 200,
            body: JSON.stringify(result),
            headers,
        };
    }
    catch (e) {
        return errorHandler(e, headers);
    }
};
const processCorsless = async (event, routes, config, services) => {
    return await generalHandler(config, services, routes, event, {});
};
exports.processCorsless = processCorsless;
const processCors = async (event, routes, config, services) => {
    let origin = false;
    try {
        origin = validateOrigin(config, services, event);
    }
    catch (e) {
        return {
            statusCode: 400,
            body: JSON.stringify({ error: 'error.invalid_origin' }),
        };
    }
    const headers = {
        'Access-Control-Allow-Origin': origin,
        'Access-Control-Allow-Credentials': true,
    };
    return await generalHandler(config, services, routes, event, headers);
};
exports.processCors = processCors;
//# sourceMappingURL=lambda.js.map