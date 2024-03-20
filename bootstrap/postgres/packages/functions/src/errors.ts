import { addErrors, EError } from '@vramework/core/dist/errors'

export class UserNotFoundError extends EError {}
export class ExceededMaxEmailAmount extends EError {}

addErrors([
    [UserNotFoundError, { status: 404, message: 'user_not_found' }],
    [ExceededMaxEmailAmount, { status: 403, message: 'email_amount_exceeded' }]
])
