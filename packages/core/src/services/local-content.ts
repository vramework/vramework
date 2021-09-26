import { Logger } from 'pino'
import { promises } from 'fs'
import { CoreConfig } from '../config'
import { ContentService } from '../services'

export class LocalContent implements ContentService {
  constructor(private config: CoreConfig, private logger: Logger) { }

  public async init() { }

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

  public async writeFile(assetKey: string, buffer: Buffer): Promise<boolean> {
    this.logger.info(`Writing file: ${assetKey}`)
    try {
      await promises.writeFile(`${this.config.content.localFileUploadPath}/${assetKey}`, buffer)
    } catch (e) {
      this.logger.error(`Error inserting content ${assetKey}`, e)
    }
    return false
  }

  public async readFile(assetKey: string): Promise<Buffer> {
    this.logger.info(`getting key: ${assetKey}`)
    try {
      return await promises.readFile(`${this.config.content.localFileUploadPath}/${assetKey}`)
    } catch (e) {
      this.logger.error(`Error get content ${assetKey}`)
      throw e
    }
  }

  public async deleteFile(assetKey: string): Promise<boolean> {
    this.logger.info(`deleting key: ${assetKey}`)
    try {
      await promises.unlink(`${this.config.content.localFileUploadPath}/${assetKey}`)
    } catch (e: any) {
      this.logger.error(`Error deleting content ${assetKey}`, e)
    }
    return false
  }
}
