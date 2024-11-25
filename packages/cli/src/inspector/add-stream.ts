import * as ts from 'typescript'
import { VisitState } from './visit.js'
import { getPropertyValue } from './get-property-value.js'
import { pathToRegexp } from 'path-to-regexp'
import { APIDocs } from '@vramework/core/types/core.types'
import { getInputTypes } from './add-route.js'
import { getFunctionTypes } from './utils.js'
import { StreamMeta } from '@vramework/core'

const addConnect = (obj: ts.ObjectLiteralExpression) => {
  const funcProperty = obj.properties.find(
    (p) =>
      ts.isPropertyAssignment(p) &&
      ts.isIdentifier(p.name) &&
      p.name.text === 'onConnect'
  )
  return !!funcProperty
}

const addDisconnect = (obj: ts.ObjectLiteralExpression) => {
  const funcProperty = obj.properties.find(
    (p) =>
      ts.isPropertyAssignment(p) &&
      ts.isIdentifier(p.name) &&
      p.name.text === 'onDisconnect'
  )
  return !!funcProperty
}

const addMessages = (obj: ts.ObjectLiteralExpression, checker: ts.TypeChecker) => {
  const messageTypes: StreamMeta['messages'] = [];

  const messagesProperty = obj.properties.find(
    (p) =>
      ts.isPropertyAssignment(p) &&
      ts.isIdentifier(p.name) &&
      p.name.text === 'onMessage'
  );

  if (!messagesProperty || !ts.isPropertyAssignment(messagesProperty)) {
    console.log('onMessage property not found or is not a valid assignment.');
    return [];
  }

  const initializer = messagesProperty.initializer;
  if (!ts.isArrayLiteralExpression(initializer)) {
    console.log('onMessage is not an array literal.');
    return [];
  }

  initializer.elements.forEach((element) => {
    if (!ts.isObjectLiteralExpression(element)) {
      console.warn('Unexpected element type in onMessage array:', element);
      return;
    }

    const routeProperty = element.properties.find(
      (p) =>
        ts.isPropertyAssignment(p) &&
        ts.isIdentifier(p.name) &&
        p.name.text === 'route'
    );

    const funcProperty = element.properties.find(
      (p) =>
        ts.isPropertyAssignment(p) &&
        ts.isIdentifier(p.name) &&
        p.name.text === 'func'
    );

    if (!routeProperty || !ts.isPropertyAssignment(routeProperty)) {
      console.warn('No valid route property found in onMessage array element:', element);
      return;
    }

    if (!funcProperty || !ts.isPropertyAssignment(funcProperty)) {
      console.warn('No valid func property found in onMessage array element:', element);
      return;
    }

    const route = ts.isStringLiteral(routeProperty.initializer)
      ? routeProperty.initializer.text
      : null;

    if (!route) {
      console.warn('Route property is not a string literal:', routeProperty.initializer);
      return;
    }

    const { inputType, outputType } = getFunctionTypes(checker, funcProperty);
    messageTypes.push({
      route,
      input: inputType,
      output: outputType,
    });
  });

  return messageTypes;
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

    const connect = addConnect(obj)
    const disconnect = addDisconnect(obj)
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
