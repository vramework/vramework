import { CoreAPIStream, CoreAPIStreams, RunStreamOptions, RunStreamParams, StreamsMeta } from "./stream.types.js"
import { match } from "path-to-regexp"
import { closeServices, validateAndCoerce } from "../utils.js"
import { verifyPermissions } from "../permissions.js"
import { createHTTPInteraction, handleError, loadUserSession } from "../http/route-runner.js"
import { registerMessageHandlers } from "./stream-message-handler.js"

let streams: CoreAPIStreams = []
let streamsMeta: StreamsMeta = []

export const addStream = <
  In,
  Route extends string,
  StreamFunction,
  StreamFunctionSessionless,
  APIPermission,
>(
  stream: CoreAPIStream<
    In,
    Route,
    StreamFunction,
    StreamFunctionSessionless,
    APIPermission
  >
) => {
  streams.push(stream as any)
}

export const clearStreams = () => {
  streams = []
}

/**
 * @ignore
 */
export const addStreamsMeta = (_streamsMeta: StreamsMeta) => {
  streamsMeta = _streamsMeta
}

/**
 * Returns all the registered routes and associated metadata.
 * @internal
 */
export const getStreams = () => {
  return {
    streams,
    streamsMeta,
  }
}

const getMatchingStreamConfig = (
  requestPath: string
) => {
  for (const streamConfig of streams) {
    const matchFunc = match(streamConfig.route.replace(/^\/\//, '/'), {
      decode: decodeURIComponent,
    })
    const matchedPath = matchFunc(requestPath.replace(/^\/\//, '/'))
    if (matchedPath) {
      const schemaName = streamsMeta.find(
        (streamMeta) => streamMeta.route === streamConfig.route
      )?.input
      return { matchedPath, params: matchedPath.params, streamConfig, schemaName }
    }
  }

  return null
}

/**
 * @ignore
 */
export const runStream = async ({
  singletonServices,
  request,
  response,
  stream,
  route: streamRoute,
  createSessionServices,
  skipUserSession = false,
  respondWith404 = true,
  coerceToArray = false,
  logWarningsForStatusCodes = [],
}: Pick<CoreAPIStream<unknown, any>, 'route'> & RunStreamOptions & RunStreamParams<unknown>): Promise<void> => {
  let sessionServices: any | undefined
  const trackerId: string = crypto.randomUUID().toString()
  const http = createHTTPInteraction(request, response)

  const matchingStream = getMatchingStreamConfig(streamRoute)
  if (!matchingStream) {
    if (respondWith404) {
      http?.response?.setStatus(404)
      http?.response?.end()
    }
    return
  }

  try {
    const { matchedPath, params, streamConfig, schemaName } = matchingStream

    const requiresSession = streamConfig.auth !== false
    http?.request?.setParams(params)

    singletonServices.logger.info(
      `Matched stream: ${streamConfig.route} | auth: ${requiresSession.toString()}`
    )

    const session = await loadUserSession(skipUserSession, requiresSession, http, matchedPath, streamConfig, singletonServices.logger, singletonServices.sessionService)
    const data = await request.getData()

    validateAndCoerce(singletonServices.logger, schemaName, data, coerceToArray)

    sessionServices = await createSessionServices(
      singletonServices,
      { http },
      session
    )
    const allServices = { ...singletonServices, ...sessionServices }

    await verifyPermissions(streamConfig.permissions, allServices, data, session)

    await streamConfig.onConnect?.(
      allServices,
      data,
      session!
    )

    registerMessageHandlers(streamConfig, stream, allServices, session)

    stream.onClose(async () => {
      streamConfig.onDisconnect?.(
        allServices,
        data,
        session!
      )
      await closeServices(singletonServices.logger, sessionServices)
    })

  } catch (e: any) {
    handleError(e, http, trackerId, singletonServices.logger, logWarningsForStatusCodes)
    await closeServices(singletonServices.logger, sessionServices)
    throw e
  }
}

