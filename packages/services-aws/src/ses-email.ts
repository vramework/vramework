import { SESClient, SendTemplatedEmailCommand } from "@aws-sdk/client-ses"

import { CoreConfig } from "@vramework/core/dist/config"

export class AWSSES {
    private client: SESClient

    constructor(awsRegion: string, private config: CoreConfig) {
        this.client = new SESClient({ region: awsRegion })
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
        } catch (e: any) {
            console.error(e)
            return false
        }
    }
}
