import { ContentService, Logger } from '@vramework/core/services'

export interface LocalContentConfig {
  contentDirectory: string
  assetsUrl: string
}

/**
 * Service for handling local content operations.
 */
export abstract class LocalContent implements ContentService {
  /**
   * @param localFileDirectory - The directory where local files are stored.
   * @param logger - A logger for logging information.
   */
  constructor(
    private localFileDirectory: string,
    private logger: Logger
  ) {}

  public abstract getUploadURL: (
    fileKey: string,
    contentType: string
  ) => Promise<{ uploadUrl: string; assetKey: string }>

  /**
   * Initializes the local content service.
   * @description This method is intended to perform any necessary initialization for the local content service.
   */
  public async init() {}

  /**
   * Signs a URL to provide secure access.
   * @param url - The URL to sign.
   * @returns A promise that resolves to the signed URL.
   * @description This method appends a query parameter to the provided URL to indicate it has been signed.
   */
  public async signURL(url: string): Promise<string> {
    return `${url}?signed=true`
  }

  /**
   * Signs a content key to provide secure access to an asset.
   * @param assetKey - The key of the asset to sign.
   * @returns A promise that resolves to the signed content key URL.
   * @description This method constructs a URL for the asset and appends query parameter to indicate it has been signed.
   */
  public async signContentKey(assetKey: string): Promise<string> {
    return `http://localhost:4002/assets/${assetKey}?signed=true`
  }
}
