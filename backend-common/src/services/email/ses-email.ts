import { SESClient, SendTemplatedEmailCommand } from "@aws-sdk/client-ses"
import { CoreConfig } from "../../config"
import { EmailService } from "./email"

export class AWSSES implements EmailService {
    private client: SESClient

    constructor(private config: CoreConfig) {
        this.client = new SESClient({ region: config.awsRegion })
    }

    public async sendResetPasswordEmail(to: string, username: string, resetHash: string): Promise<boolean> {
        if (process.env.NODE_ENVIROMENT === 'production') {
            console.log(`Would have sent forgot email to ${to} ${username} ${resetHash}`)
            return true
        }
        try {
            await this.client.send(new SendTemplatedEmailCommand({
                Source: `no-reply@${this.config.domain}`,
                Destination: {
                    ToAddresses: [to],
                    CcAddresses: []
                },
                Template: 'reset-password',
                TemplateData: '{}'
            }))
            return true
        } catch (e) {
            console.error(e)
            return false
        }
    }
}
