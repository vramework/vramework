/**
 * @module @vramework/fetch
 *
 * This module provides a wrapper around the Fetch API that integrates with the Vramework framework.
 * It includes utilities for making HTTP requests, such as options for authorization, server URL management,
 * and transforming dates in responses, while ensuring requests are validated against Vramework routes.
 * The module exports the `CoreVrameworkFetch` class, as well as other supporting types and functions.
 */

export {
  CoreVrameworkFetch,
  CoreVrameworkFetchOptions,
  HTTPMethod,
} from './core-vramework-fetch.js'
export { coreVrameworkFetch } from './vramework-fetch.js'
