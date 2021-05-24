import { Logger } from 'pino'
import { promises } from 'fs'
import { ContentService } from './content'
import { CoreConfig } from '../../config'

export class LocalContent implements ContentService {
  constructor(private config: CoreConfig, private logger: Logger) {}

  public async signURL(url: string): Promise<string> {
    return `${url}?signed=true`
  }

  public async getUploadURL(assetKey: string): Promise<{ uploadUrl: string, assetUrl: string }> {
    return {
      uploadUrl: `http://localhost:4002/api/${this.config.content.localFileUploadPath.replace(':assetKey', assetKey)}`,
      assetUrl: `http://localhost:4002/assets/${assetKey}`,
    }
  }

  public async delete(key: string): Promise<boolean> {
    this.logger.info(`deleting key: ${key}`)
    try {
      await promises.unlink(key.replace('http://localhost:4002/assets', `${__dirname}/../../../../../.uploads`))
    } catch (e) {
      this.logger.error(`Error deleting content ${key}`, e)
    }
    return false
  }
}
