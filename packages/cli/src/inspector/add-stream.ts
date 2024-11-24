import * as ts from 'typescript'
import { VisitState } from './visit.js'
import { getPropertyValue } from './get-property-value.js'
import { pathToRegexp } from 'path-to-regexp'
import { APIDocs } from '@vramework/core/types/core.types'
import { extractTypeKeys, getInputTypes, nullifyTypes } from './add-route.js'

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

    // Find the 'func' property within the object
    const funcProperty = obj.properties.find(
      (p) =>
        ts.isPropertyAssignment(p) &&
        ts.isIdentifier(p.name) &&
        p.name.text === 'func'
    )

    if (funcProperty && ts.isPropertyAssignment(funcProperty)) {
      const funcExpression = funcProperty.initializer

      // Get the type of the 'func' expression
      const funcType = checker.getTypeAtLocation(funcExpression)

      // Get the call signatures of the function type
      const callSignatures = funcType.getCallSignatures()

      for (const signature of callSignatures) {
        const parameters = signature.getParameters()

        for (const param of parameters) {
          const paramType = checker.getTypeOfSymbolAtLocation(
            param,
            param.valueDeclaration!
          )

          if (param.name === 'data') {
            inputType = checker.typeToString(paramType)
            queryValues = [
              ...new Set([...queryValues, ...extractTypeKeys(paramType)]),
            ].filter((query) => !paramsValues?.includes(query))
          }
        }
      }
    }

    if (!routeValue) {
      return
    }

    state.streamsMeta.push({
      route: routeValue!,
      input: nullifyTypes(inputType),
      params: paramsValues.length > 0 ? paramsValues : undefined,
      query: queryValues.length > 0 ? queryValues : undefined,
      inputTypes: getInputTypes(
        state.metaInputTypes,
        'get',
        inputType,
        queryValues,
        paramsValues
      ),
      docs,
    })

    if (inputType) {
      state.inputTypes.add(inputType)
    }
  }
}
