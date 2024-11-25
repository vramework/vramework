import * as ts from 'typescript'
import { VisitState } from './visit.js'
import { getPropertyValue } from './get-property-value.js'
import { pathToRegexp } from 'path-to-regexp'
import { APIRouteMethod } from '@vramework/core/http/routes.types'
import { APIDocs } from '@vramework/core/types/core.types'
import { extractTypeKeys, getFunctionTypes } from './utils.js'

export const getInputTypes = (
  metaTypes: Map<string, string>,
  methodType: string,
  inputType: string | null,
  queryValues: string[],
  paramsValues: string[]
) => {
  if (!inputType) {
    return undefined
  }
  const query =
    queryValues.length > 0
      ? `Pick<${inputType}, '${queryValues.join("' | '")}'>`
      : undefined
  const params =
    paramsValues.length > 0
      ? `Pick<${inputType}, '${paramsValues.join("' | '")}'>`
      : undefined
  const body =
    queryValues.length > 0 || paramsValues.length > 0
      ? `Omit<${inputType}, '${[...new Set([...queryValues, ...paramsValues])].join("' | '")}'>`
      : inputType!
  if (inputType) {
    let queryTypeName: string | undefined
    if (query) {
      queryTypeName = `${inputType}Query`
      metaTypes.set(queryTypeName, query)
    }

    let paramsTypeName: string | undefined
    if (params) {
      paramsTypeName = `${inputType}Params`
      metaTypes.set(paramsTypeName, params)
    }

    let bodyTypeName: string | undefined
    if (body && ['post', 'put', 'patch'].includes(methodType)) {
      bodyTypeName = `${inputType}Body`
      metaTypes.set(bodyTypeName, body)
    }

    return {
      query: queryTypeName,
      params: paramsTypeName,
      body: bodyTypeName,
    }
  }
  return undefined
}

export const addRoute = (
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
  if (!ts.isIdentifier(expression) || expression.text !== 'addRoute') {
    return
  }

  if (!firstArg) {
    return
  }

  let docs: APIDocs | undefined
  let methodValue: string | null = null
  let paramsValues: string[] | null = []
  let queryValues: string[] | [] = []
  let routeValue: string | null = null

  state.filesWithRoutes.add(node.getSourceFile().fileName)

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
    methodValue = getPropertyValue(obj, 'method') as string
    queryValues = (getPropertyValue(obj, 'query') as string[]) || []

    const funcProperty = obj.properties.find(
      (p) =>
        ts.isPropertyAssignment(p) &&
        ts.isIdentifier(p.name) &&
        p.name.text === 'func'
    )

    if (!funcProperty) {
      console.error('Missing func property in route')
      return
    }

    const { inputType, outputType, paramType } = getFunctionTypes(checker, funcProperty)

    if (paramType && !['post', 'put', 'patch'].includes(methodValue)) {
      queryValues = [
        ...new Set([...queryValues, ...extractTypeKeys(paramType)]),
      ].filter((query) => !paramsValues?.includes(query))
    }

    if (!routeValue) {
      return
    }

    state.routesMeta.push({
      route: routeValue!,
      method: methodValue! as APIRouteMethod,
      input: inputType,
      output: outputType,
      params: paramsValues.length > 0 ? paramsValues : undefined,
      query: queryValues.length > 0 ? queryValues : undefined,
      inputTypes: getInputTypes(
        state.metaInputTypes,
        methodValue,
        inputType,
        queryValues,
        paramsValues
      ),
      docs,
    })

    if (inputType) {
      state.inputTypes.add(inputType)
    }

    if (outputType) {
      state.outputTypes.add(outputType)
    }
  }
}
