import { ContentService } from './content-service.js'
import { Logger } from './logger.js'

export interface LocalContentConfig {
  contentDirectory: string
  assetsUrl: string
  uploadUrl: string
}

/**
 * Service for handling local content operations.
 */
export abstract class LocalContent implements ContentService {
  constructor(_config: LocalContentConfig, _logger: Logger) {}

  public abstract getUploadURL: (
    fileKey: string,
    contentType: string
  ) => Promise<{ uploadUrl: string; assetKey: string }>

  /**
   * Initializes the local content service.
   */
  public abstract init(): Promise<void>

  /**
   * Signs a URL to provide secure access.
   * @param url - The URL to sign.
   * @returns A promise that resolves to the signed URL.
   */
  public abstract signURL(url: string): Promise<string>

  /**
   * Signs a content key to provide secure access to an asset.
   * @param assetKey - The key of the asset to sign.
   * @returns A promise that resolves to the signed content key URL.
   */
  public abstract signContentKey(assetKey: string): Promise<string>
}
