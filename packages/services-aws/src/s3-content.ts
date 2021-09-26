import {
  S3Client,
  DeleteObjectCommand,
  PutObjectCommand,
  GetObjectCommand,
} from '@aws-sdk/client-s3'
import { getSignedUrl as getS3SignedUrl } from '@aws-sdk/s3-request-presigner'

import { ContentService } from '@vramework/core/dist/services'
import { CoreConfig } from '@vramework/core/dist/config'
import { Logger as PinoLogger } from 'pino'

// @ts-ignore
import { getSignedUrl as getCDNSignedUrl } from 'aws-cloudfront-sign'

export class S3Content implements ContentService {
  private s3: S3Client

  constructor(private config: CoreConfig, private logger: PinoLogger, private signConfig: { keypairId: string; privateKeyString: string }) {
    this.s3 = new S3Client({ region: this.config.awsRegion })
  }

  public async signURL(url: string) {
    try {
      return getCDNSignedUrl(url, this.signConfig)
    } catch (e: any) {
      this.logger.error(`Error signing url: ${url}`)
      return url
    }
  }

  public async signContentKey(key: string) {
    return this.signURL(`https://content.${this.config.domain}/${key}`)
  }

  public async getUploadURL(Key: string, ContentType: string) {
    const command = new PutObjectCommand({
      Bucket: `content.${this.config.domain}`,
      Key,
      ContentType,
    })
    return {
      uploadUrl: await getS3SignedUrl(this.s3, command, {
        expiresIn: 3600,
      }),
      assetKey: Key
    }
  }

  public async readFile(Key: string) {
    return new Promise<Buffer>(async (resolve, reject) => {
      try {
        this.logger.info(`Getting file, key: ${Key}`)
        const response = await this.s3.send(
          new GetObjectCommand({
            Bucket: `content.${this.config.domain}`,
            Key,
          }),
        )
        const body = response.Body as any
        const responseDataChunks: any[] = []
        body.on('data', (chunk: any) => responseDataChunks.push(chunk))
        body.once('end', () => resolve(Buffer.concat(responseDataChunks)))
      } catch (err) {
        // Handle the error or throw
        return reject(err)
      }
    })
  }

  public async writeFile(Key: string, buffer: Buffer) {
    try {
      this.logger.info(`Write file, key: ${Key}`)
      await this.s3.send(
        new PutObjectCommand({
          Bucket: `content.${this.config.domain}`,
          Key,
          Body: buffer
        }),
      )
      return true
    } catch (e: any) {
      this.logger.error(`Error writing file, key: ${Key}`, e)
      return false
    }
  }

  public async deleteFile(Key: string) {
    try {
      this.logger.info(`Deleting file, key: ${Key}`)
      await this.s3.send(
        new DeleteObjectCommand({
          Bucket: `content.${this.config.domain}`,
          Key,
        }),
      )
      return true
    } catch (e: any) {
      this.logger.error(`Error deleting file, key: ${Key}`, e)
      return false
    }
  }
}
