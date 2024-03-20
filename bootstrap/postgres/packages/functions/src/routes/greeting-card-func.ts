
// Creating this file and running the generateRoutes will automatically add this API endpoint to
// express or/and serverless.
import { APIFunction, APIPermission, APIRoutes } from "../api"

export interface SendGreetingCard {
  toUserId: string,
  emailText: string
}

export interface SendGreetingCardResult {
  message: string
}

const sendGreetingCard: APIFunction<SendGreetingCard, SendGreetingCardResult> =
  async (services, { toUserId, emailText }, { userId }) => {
    // This line can be any database driver
    const [fromUser, toUser]: any = []

    // Assuming you have en email service hooked up!
    await services.email.sendEmail({
      template: 'getting',
      from: fromUser.email,
      to: toUser.email,
      body: emailText
    })

    return {
      message: 'Email sent!'
    }
  }

const isBelowEmailLimit: APIPermission<SendGreetingCard> = async (services, data, session) => {
  return false
}

const isPaidMember: APIPermission<SendGreetingCard> = async (services, data, session) => {
  return session.isPaidMember
}

export const routes: APIRoutes = [{
  // The TYPE of HTTP Message
  type: 'post',
  // The HTTP Route (supports query and path params)
  route: 'v1/send-greeting-card',
  // The function to execute
  func: sendGreetingCard,
  // The JSON schema to generate from typescript and validate against
  schema: 'SendGreetingCard',
  // A set of permissions to check against, at least one has to be valid
  permissions: {
    // Either a collection of permissions to be anded
    canSendCard: [isBelowEmailLimit],
    // Or a single one
    isPaidMember
  }
}]