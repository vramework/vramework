import { Logger } from './logger'
import { promises } from 'fs'
import { ContentService } from '../types'
import { mkdir } from 'fs/promises'

export class LocalContent implements ContentService {
  constructor(private localFileDirectory: string, private logger: Logger) { }

  public async init() { }

  public async signURL(url: string): Promise<string> {
    return `${url}?signed=true`
  }

  public async signContentKey(assetKey: string): Promise<string> {
    return `http://localhost:4002/assets/${assetKey}?signed=true`
  }

  public async getUploadURL(assetKey: string) {
    this.logger.debug(`going to upload with key: ${assetKey}`)
    return {
      uploadUrl: `http://localhost:4002/api/v1/reaper/${assetKey}`,
      assetKey
    }
  }

  public async writeFile(assetKey: string, buffer: Buffer): Promise<boolean> {
    this.logger.debug(`Writing file: ${assetKey}`)
    try {
      const path = `${this.localFileDirectory}/${assetKey}`
      await this.createDirectoryForFile(path)
      await promises.writeFile(path, buffer)
    } catch (e: any) {
      console.error(e)
      this.logger.error(`Error inserting content ${assetKey}`, e)
    }
    return false
  }

  public async copyFile(assetKey: string, fromAbsolutePath: string): Promise<boolean> {
    this.logger.debug(`Writing file: ${assetKey}`)
    try {
      const path = `${this.localFileDirectory}/${assetKey}`
      await this.createDirectoryForFile(path)
      await promises.copyFile(fromAbsolutePath, path)
    } catch (e: any) {
      console.error(e)
      this.logger.error(`Error inserting content ${assetKey}`, e)
    }
    return false
  }

  public async readFile(assetKey: string): Promise<Buffer> {
    this.logger.debug(`getting key: ${assetKey}`)
    try {
      return await promises.readFile(`${this.localFileDirectory}/${assetKey}`)
    } catch (e: any) {
      this.logger.error(`Error get content ${assetKey}`)
      throw e
    }
  }

  public async deleteFile(assetKey: string): Promise<boolean> {
    this.logger.debug(`deleting key: ${assetKey}`)
    try {
      await promises.unlink(`${this.localFileDirectory}/${assetKey}`)
    } catch (e: any) {
      this.logger.error(`Error deleting content ${assetKey}`, e)
    }
    return false
  }

  private async createDirectoryForFile (path: string): Promise<void> {
      const dir = path.split('/').slice(0, -1).join('/')
      await mkdir(dir, { recursive: true })
  }
}
