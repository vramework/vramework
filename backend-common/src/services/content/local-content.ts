import { Logger } from 'pino'
import { promises } from 'fs'
import { ContentService } from './content'
import { CoreConfig } from '../../config'

export class LocalContent implements ContentService {
  constructor(private config: CoreConfig, private logger: Logger) {}

  public async init () {}

  public async signURL(url: string): Promise<string> {
    return `${url}?signed=true`
  }

  public async signContentKey(assetKey: string): Promise<string> {
    return `http://localhost:4002/assets/${assetKey}?signed=true`
  }

  public async getUploadURL(assetKey: string) {
    this.logger.info(`going to upload with key: ${assetKey}`)
    return {
      uploadUrl: `http://localhost:4002/v1/reaper/${assetKey}`,
      assetKey
    }
  }

  public async delete(assetKey: string): Promise<boolean> {
    console.trace()
    this.logger.info(`deleting key: ${assetKey}`)
    try {
      await promises.unlink(assetKey.replace('http://localhost:4002/assets', this.config.content.localFileUploadPath))
    } catch (e) {
      this.logger.error(`Error deleting content ${assetKey}`, e)
    }
    return false
  }
}
