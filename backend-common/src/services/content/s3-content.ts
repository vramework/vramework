import { Logger } from 'pino'
import { Config } from '@samarambi/functions'
import { S3, CloudFront } from 'aws-sdk'
import { ContentService } from './content'

export class S3Content implements ContentService {
  private s3 = new S3({ signatureVersion: 'v4' })
  private cloudfront: CloudFront.Signer

  constructor(private config: Config, credentials: { keyId: string; privateKey: string }, private logger: Logger) {
    this.cloudfront = new CloudFront.Signer(credentials.keyId, credentials.privateKey)
  }

  public async signURL(url: string): Promise<string> {
    return this.cloudfront.getSignedUrl({
      url,
      expires: Date.now() + 15 * 60 * 1000,
    })
  }

  public async getUploadURL(Key: string, ContentType: string): Promise<{ uploadUrl: string, assetUrl: string }> {
    this.logger.info({ action: 'Signing content object', key: Key })
    return {
      uploadUrl: await this.s3.getSignedUrlPromise('putObject', {
        Bucket: `content.${this.config.domain}`,
        Key,
        ContentType,
      }),
      assetUrl: `https://content.${this.config.domain}/${Key}`,
    }
  }

  public async delete(Key: string): Promise<boolean> {
    this.logger.info({ action: 'Deleting content object', key: Key })
    await this.s3
      .deleteObject({
        Bucket: `content.${this.config.domain}`,
        Key: Key.replace(`https://content.${this.config.domain}/`, ''),
      })
      .promise()
    return true
  }
}
