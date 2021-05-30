import { SESClient, SendTemplatedEmailCommand } from "@aws-sdk/client-ses"
import { EmailService } from "./email"

export class AWSSES implements EmailService {
    private client: SESClient

    constructor() {
        this.client = new SESClient({ region: "eu-central-1" })
    }

    public async sendResetPasswordEmail(to: string, username: string, resetHash: string): Promise<boolean> {
        if (process.env.NODE_ENVIROMENT === 'production') {
            console.log(`Would have sent forgot email to ${to} ${username} ${resetHash}`)
            return true
        }
        try {
            await this.client.send(new SendTemplatedEmailCommand({
                Source: 'no-reply@samarambi.com',
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
