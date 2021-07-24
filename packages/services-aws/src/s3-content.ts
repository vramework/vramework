import {
  S3Client,
  DeleteObjectCommand,
  PutObjectCommand,
} from '@aws-sdk/client-s3'
import { getSignedUrl as getS3SignedUrl } from '@aws-sdk/s3-request-presigner'

import { ContentService } from '@vramework/core/dist/services/content/content'
import { SecretService } from '@vramework/core/dist/services/secrets/secrets'
import { CoreConfig } from '@vramework/core/dist/config'
import { Logger as PinoLogger } from 'pino'

// @ts-ignore
import { getSignedUrl as getCDNSignedUrl } from 'aws-cloudfront-sign'

export class S3Content implements ContentService {
  private signConfig!: { keypairId: string; privateKeyString: string }
  private s3: S3Client

  constructor(private config: CoreConfig, private logger: PinoLogger) {
    this.s3 = new S3Client({ region: this.config.awsRegion })
  }

  public async init(secrets: SecretService) {
    this.signConfig = {
      keypairId:  await secrets.getSecret(this.config.secrets.cloudfrontContentId),
      privateKeyString: await secrets.getSecret(this.config.secrets.cloudfrontContentPrivateKey)
    }
  }

  public async signURL(url: string) {
    try {
      return getCDNSignedUrl(url, this.signConfig)
    } catch (e) {
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

  public async delete(Key: string) {
    try {
      this.logger.info(`Deleting file, key: ${Key}`)
      await this.s3.send(
        new DeleteObjectCommand({
          Bucket: `content.${this.config.domain}`,
          Key,
        }),
      )
      return true
    } catch (e) {
      this.logger.error(`Error deleting file, key: ${Key}`, e)
      return false
    }
  }
}
