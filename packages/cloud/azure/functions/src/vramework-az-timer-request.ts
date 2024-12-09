import { InvocationContext } from '@azure/functions'
import { VrameworkRequest } from '@vramework/core'

export class VrameworkAZTimerRequest<In = any> extends VrameworkRequest<In> {
  constructor(_context: InvocationContext, data: In) {
    super(data)
  }
}
