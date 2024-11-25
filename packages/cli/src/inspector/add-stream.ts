import * as ts from 'typescript'
import { VisitState } from './visit.js'
import { getPropertyValue } from './get-property-value.js'
import { pathToRegexp } from 'path-to-regexp'
import { APIDocs } from '@vramework/core/types/core.types'
import { getInputTypes } from './add-route.js'
import { getTypeOfFunctionArg, getFunctionTypes, nullifyTypes } from './utils.js'
import { StreamMeta } from '@vramework/core'

const addConnect = (obj: ts.ObjectLiteralExpression, checker: ts.TypeChecker) => {
  const funcProperty = obj.properties.find(
    (p) =>
      ts.isPropertyAssignment(p) &&
      ts.isIdentifier(p.name) &&
      p.name.text === 'onConnect'
  )
  return funcProperty ? {
    input: nullifyTypes(getTypeOfFunctionArg(checker, funcProperty, 1))
  } : undefined
}

const addDisconnect = (obj: ts.ObjectLiteralExpression, checker: ts.TypeChecker) => {
  const funcProperty = obj.properties.find(
    (p) =>
      ts.isPropertyAssignment(p) &&
      ts.isIdentifier(p.name) &&
      p.name.text === 'onDisconnect'
  )
  return funcProperty ? {} : undefined
}

const addMessages = (obj: ts.ObjectLiteralExpression, checker: ts.TypeChecker) => {
  const messageTypes: StreamMeta['messages'] = []

  const messagesProperty = obj.properties.find(
    (p) =>
      ts.isPropertyAssignment(p) &&
      ts.isIdentifier(p.name) &&
      p.name.text === 'onMessage'
  );

  if (!messagesProperty || !ts.isPropertyAssignment(messagesProperty)) {
    console.log('onMessage property not found or is not a valid assignment.');
    return []
  }

  const initializer = messagesProperty.initializer;
  if (!ts.isObjectLiteralExpression(initializer)) {
    console.log('onMessage is not an object literal.');
    return []
  }

  initializer.properties.forEach((property) => {
    // Ensure the property is a PropertyAssignment
    if (!ts.isPropertyAssignment(property)) {
      console.warn('Unexpected property type:', property);
      return;
    }

    const propertyName = ts.isIdentifier(property.name)
      ? property.name.text
      : ts.isStringLiteral(property.name)
        ? property.name.text
        : null;

    if (!propertyName) {
      console.warn('Unexpected property key type:', property.name);
      return;
    }

    if (ts.isObjectLiteralExpression(property.initializer)) {
      const funcProperty = property.initializer.properties.find(
        (p) =>
          ts.isPropertyAssignment(p) &&
          ts.isIdentifier(p.name) &&
          p.name.text === 'func'
      );

      if (!funcProperty) {
        console.warn(`No 'func' property found for message '${propertyName}'.`);
        return
      }

      if (funcProperty && ts.isPropertyAssignment(funcProperty)) {
        const { inputType, outputType } = getFunctionTypes(checker, funcProperty);
        messageTypes.push({
          route: propertyName,
          input: inputType,
          output: outputType
        })
      }
    } else {
      console.warn('Initializer is not an object literal:', property.initializer);
    }
  });

  return messageTypes
};

export const addStream = (
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
  if (!ts.isIdentifier(expression) || expression.text !== 'addStream') {
    return
  }

  if (!firstArg) {
    return
  }

  let docs: APIDocs | undefined
  let paramsValues: string[] | null = []
  let queryValues: string[] | [] = []
  let inputType: string | null = null
  let routeValue: string | null = null

  state.filesWithStreams.add(node.getSourceFile().fileName)

  // Check if the first argument is an object literal
  if (ts.isObjectLiteralExpression(firstArg)) {
    const obj = firstArg

    routeValue = getPropertyValue(obj, 'route') as string | null
    if (routeValue) {
      const { keys } = pathToRegexp(routeValue)
      paramsValues = keys.reduce((result, { type, name }) => {
        if (type === 'param') {
          result.push(name)
        }
        return result
      }, [] as string[])
    }

    docs = (getPropertyValue(obj, 'docs') as APIDocs) || undefined
    queryValues = (getPropertyValue(obj, 'query') as string[]) || []

    const connect = addConnect(obj, checker)
    const disconnect = addDisconnect(obj, checker)
    const messages = addMessages(obj, checker)

    if (!routeValue) {
      return
    }

    state.streamsMeta.push({
      route: routeValue!,
      input: inputType,
      params: paramsValues.length > 0 ? paramsValues : undefined,
      query: queryValues.length > 0 ? queryValues : undefined,
      inputTypes: getInputTypes(
        state.metaInputTypes,
        'get',
        inputType,
        queryValues,
        paramsValues
      ),
      connect,
      disconnect,
      messages,
      docs,
    })

    if (inputType) {
      state.inputTypes.add(inputType)
    }
  }
}
