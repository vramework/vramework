export interface EmailService {
    sendResetPasswordEmail: (to: string, username: string, resetHash: string) => Promise<boolean>
}