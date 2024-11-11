import { Logger, LogLevel } from '../services/logger.js';
import { PermissionService, SessionService } from '../services/index.js';
import { VrameworkRequest } from '../vramework-request.js';
import { VrameworkResponse } from '../vramework-response.js';

/**
 * Represents a JSON primitive type which can be a string, number, boolean, null, or undefined.
 */
export type JSONPrimitive = string | number | boolean | null | undefined;

/**
 * Represents a JSON value which can be a primitive, an array, or an object.
 */
export type JSONValue = JSONPrimitive | JSONValue[] | {
    [key: string]: JSONValue;
};

/**
 * Utility type for making certain keys required and leaving the rest as optional.
 */
export type PickRequired<T, K extends keyof T> = Required<Pick<T, K>> & Partial<T>;

/**
 * Utility type for making certain keys optional while keeping the rest required.
 */
export type PickOptional<T, K extends keyof T> = Partial<T> & Pick<T, K>;

/**
 * Utility type that ensures at least one key in the given type `T` is required.
 */
export type RequireAtLeastOne<T> = {
    [K in keyof T]-?: Required<Pick<T, K>> & Partial<Pick<T, Exclude<keyof T, K>>>;
}[keyof T];

/**
 * Interface for the core configuration settings of Vramework.
 */
export interface CoreConfig {
    /** The log level for the application. */
    logLevel: LogLevel;
    /** The maximum compute time allowed, in milliseconds (optional). */
    maximumComputeTime?: number;
    /** Secrets used by the application (optional). */
    secrets?: {};
}

/**
 * Interface for server-specific configuration settings that extend `CoreConfig`.
 */
export type CoreServerConfig = CoreConfig & {
    /** The port on which the server should listen. */
    port: number;
    /** The hostname for the server. */
    hostname: string;
    /** The path for health checks (optional). */
    healthCheckPath?: string;
    /** Limits for the server, e.g., memory or request limits (optional). */
    limits?: Partial<Record<string, string>>;
};

/**
 * Represents a core user session, which can be extended for more specific session information.
 */
export interface CoreUserSession {}

/**
 * Represents request headers as either a record or a function to get headers by name.
 */
export type RequestHeaders = Record<string, string | string[] | undefined> | ((headerName: string) => string | string[] | undefined);

/**
 * Interface for core singleton services provided by Vramework.
 */
export interface CoreSingletonServices {
    /** The session service used by the application (optional). */
    sessionService?: SessionService;
    /** The permission service used for authorization (optional). */
    permissionService?: PermissionService;
    /** The core configuration for the application. */
    config: CoreConfig;
    /** The logger used by the application. */
    logger: Logger;
}

/**
 * Represents an interaction within Vramework, including a request and response.
 */
export interface VrameworkInteraction {
    request: VrameworkRequest;
    response: VrameworkResponse;
}

/**
 * Represents the core services used by Vramework, including singleton services and the request/response interaction.
 */
export type CoreServices<SingletonServices = CoreSingletonServices> = SingletonServices & VrameworkInteraction;

/**
 * Defines a function type for creating singleton services from the given configuration.
 */
export type CreateSingletonServices<Config extends CoreConfig, SingletonServices extends CoreSingletonServices> = (config: Config, ...args: any[]) => Promise<SingletonServices>;

/**
 * Defines a function type for creating session-specific services.
 */
export type CreateSessionServices<SingletonServices extends CoreSingletonServices, UserSession extends CoreUserSession, Services extends CoreServices<SingletonServices>> = (services: SingletonServices, interaction: VrameworkInteraction, session: UserSession | undefined) => Promise<Omit<Services, keyof SingletonServices | keyof VrameworkInteraction>>;

/**
 * Defines a function type for creating config.
 */
export type CreateConfig<Config extends CoreServerConfig> = () => Promise<Config>;

/**
 * Represents a query object for Vramework, where each key can be a string, a value, or an array of values.
 */
export type VrameworkQuery<T = unknown> = Record<string, string | T | null | Array<T | null>>;
