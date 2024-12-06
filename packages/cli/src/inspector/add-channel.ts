import * as ts from 'typescript'
import { VisitState } from './visit.js'
import { getPropertyValue } from './get-property-value.js'
import { pathToRegexp } from 'path-to-regexp'
import { APIDocs } from '@vramework/core/types/core.types'
import { getInputTypes } from './add-route.js'
import { getPropertyAssignment, getFunctionTypes } from './utils.js'
import { ChannelMeta } from '@vramework/core'

const addMessagesRoutes = (
  obj: ts.ObjectLiteralExpression,
  checker: ts.TypeChecker,
  inputTypeSet: Set<string>,
  outputTypeSet: Set<string>
) => {
  const messageTypes: ChannelMeta['messageRoutes'] = {}

  // Find the onMessageRoute property
  const messagesProperty = obj.properties.find(
    (p) =>
      ts.isPropertyAssignment(p) &&
      ts.isIdentifier(p.name) &&
      p.name.text === 'onMessageRoute'
  )

  if (!messagesProperty || !ts.isPropertyAssignment(messagesProperty)) {
    console.log(
      'onMessageRoute property not found or is not a valid assignment.'
    )
    return {}
  }

  const initializer = messagesProperty.initializer
  // Ensure initializer is an object literal expression
  if (!ts.isObjectLiteralExpression(initializer)) {
    console.log('onMessageRoute is not an object literal.')
    return {}
  }

  // Iterate over the first level properties (like 'event')
  initializer.properties.forEach((property) => {
    const channel = property.name!.getText()
    messageTypes[channel] = {}

    if (ts.isPropertyAssignment(property)) {
      const nestedObject = property.initializer
      if (ts.isObjectLiteralExpression(nestedObject)) {
        const keys = nestedObject.properties.map((p) => p.name?.getText())
        for (const route of keys) {
          if (route) {
            const result = getFunctionTypes(checker, nestedObject, {
              funcName: route,
              inputIndex: 0,
              outputIndex: 1,
              inputTypeSet,
              outputTypeSet,
            })
            const inputs = result?.inputs || null
            const outputs = result?.outputs || null
            messageTypes[channel][route] = { inputs, outputs }
          }
        }
      } else {
        console.warn('Nested property is not an object literal:', nestedObject)
      }
    } else {
      console.warn(
        `Property "${property.getText()}" is a ${ts.SyntaxKind[property.kind]}`
      )
    }
  })

  return messageTypes
}

export const addChannel = (
  node: ts.Node,
  checker: ts.TypeChecker,
  state: VisitState
) => {
  if (!ts.isCallExpression(node)) {
    return
  }

  const args = node.arguments
  const firstArg = args[0]
  const expression = node.expression

  // Check if the call is to addRoute
  if (!ts.isIdentifier(expression) || expression.text !== 'addChannel') {
    return
  }

  if (!firstArg) {
    return
  }

  let docs: APIDocs | undefined
  let paramsValues: string[] | null = []
  let queryValues: string[] | [] = []
  let inputType: string | null = null
  let channelValue: string | null = null

  state.channels.files.add(node.getSourceFile().fileName)

  // Check if the first argument is an object literal
  if (ts.isObjectLiteralExpression(firstArg)) {
    const obj = firstArg

    channelValue = getPropertyValue(obj, 'channel') as string | null
    if (channelValue) {
      const { keys } = pathToRegexp(channelValue)
      paramsValues = keys.reduce((result, { type, name }) => {
        if (type === 'param') {
          result.push(name)
        }
        return result
      }, [] as string[])
    }

    docs = (getPropertyValue(obj, 'docs') as APIDocs) || undefined
    queryValues = (getPropertyValue(obj, 'query') as string[]) || []

    const connect = !!getPropertyAssignment(obj, 'onConnect')
    const disconnect = !!getPropertyAssignment(obj, 'onDisconnect')
    const { inputs, outputs } = getFunctionTypes(checker, obj, {
      funcName: 'onMessage',
      inputIndex: 0,
      outputIndex: 1,
      inputTypeSet: state.channels.inputTypes,
      outputTypeSet: state.channels.outputTypes,
    })
    const message = { inputs, outputs }
    const messageRoutes = addMessagesRoutes(
      obj,
      checker,
      state.channels.inputTypes,
      state.channels.outputTypes
    )

    if (!channelValue) {
      return
    }

    state.channels.meta.push({
      channel: channelValue!,
      input: inputType,
      params: paramsValues.length > 0 ? paramsValues : undefined,
      query: queryValues.length > 0 ? queryValues : undefined,
      inputTypes: getInputTypes(
        state.channels.metaInputTypes,
        'get',
        inputType,
        queryValues,
        paramsValues
      ),
      connect,
      disconnect,
      message,
      messageRoutes,
      docs,
    })
  }
}
