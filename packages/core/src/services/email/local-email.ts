import { Logger } from 'pino'
import { EmailService } from './email'

export class LocalEmail implements EmailService {
  constructor(private logger: Logger) {}

  public async sendResetPasswordEmail(to: string, username: string, resetHash: string): Promise<boolean> {
    this.logger.info(`Would have sent email to ${to} ${username} ${resetHash}`)
    return true
  }
}
