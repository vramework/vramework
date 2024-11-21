import * as ts from 'typescript'
import { VisitState } from './visit.js'
import { getPropertyValue } from './get-property-value.js'
import { APIDocs } from '@vramework/core'

export const addSchedule = (
  node: ts.Node,
  _checker: ts.TypeChecker,
  state: VisitState
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

  state.filesWithScheduledTasks.add(node.getSourceFile().fileName)

  if (ts.isObjectLiteralExpression(firstArg)) {
    const obj = firstArg

    const titleValue = getPropertyValue(obj, 'title') as string | null
    const scheduleValue = getPropertyValue(obj, 'schedule') as string | null
    const docs = (getPropertyValue(obj, 'docs') as APIDocs) || undefined

    if (!titleValue || !scheduleValue) {
      return
    }

    state.scheduledTasksMeta.push({
      title: titleValue,
      schedule: scheduleValue,
      docs,
    })
  }
}
