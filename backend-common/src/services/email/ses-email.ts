import { Logger } from 'pino'
import { Config } from '../../api'
import { SES, config } from 'aws-sdk'
import { EmailService } from './email'

config.apiVersions = {
    ...config.apiVersions,
    ses: '2010-12-01',
}

export class SESEmail implements EmailService {
    private ses = new SES()

    constructor(private config: Config, private logger: Logger) { }

    public async sendResetPasswordEmail(to: string, username: string, resetHash: string): Promise<boolean> {
        const params = {
            Destination: {
                ToAddresses: [to],
            },
            Message: {
                Body: {
                    Html: {
                        Charset: 'UTF-8',
                        Data: `Hello ${username}!
  <br/>
  Click <a class="ulink" href="https://${this.config.domain}/password-reset?resetHash=${resetHash}" target="_blank">here</a> to reset your password.
  <br/>
  If you didn't request a password reset, you can ignore this message and consider yourself famous!
  <br/>
  Warm Regards,
  <br/>
  Samarambi
  `,
                    },
                },
                Subject: {
                    Charset: 'UTF-8',
                    Data: 'Samarambi Password Reset',
                },
            },
            Source: 'no-reply@samarambi.com',
        }
        try {
            await this.ses.sendEmail(params).promise()
            return true
        } catch (e) {
            this.logger.error(e)
            return false
        }
    }
}
