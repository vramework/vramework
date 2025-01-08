import * as ts from 'typescript'
import { getPropertyValue } from './get-property-value.js'
import { APIDocs } from '@vramework/core'
import { InspectorState } from './types.js'

export const addSchedule = (
  node: ts.Node,
  _checker: ts.TypeChecker,
  state: InspectorState
) => {
  if (!ts.isCallExpression(node)) {
    return
  }

  const args = node.arguments
  const firstArg = args[0]
  const expression = node.expression

  // Check if the call is to addScheduledTask
  if (!ts.isIdentifier(expression) || expression.text !== 'addScheduledTask') {
    return
  }

  if (!firstArg) {
    return
  }

  state.scheduledTasks.files.add(node.getSourceFile().fileName)

  if (ts.isObjectLiteralExpression(firstArg)) {
    const obj = firstArg

    const nameValue = getPropertyValue(obj, 'name') as string | null
    const scheduleValue = getPropertyValue(obj, 'schedule') as string | null
    const docs = (getPropertyValue(obj, 'docs') as APIDocs) || undefined

    if (!nameValue || !scheduleValue) {
      return
    }

    state.scheduledTasks.meta.push({
      name: nameValue,
      schedule: scheduleValue,
      docs,
    })
  }
}
