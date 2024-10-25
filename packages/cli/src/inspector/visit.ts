import * as ts from "typescript"
import { addFileWithConfig } from "./add-file-with-config.js"
import { addFileWithFactory } from "./add-file-with-factory.js"
import { getPropertyValue } from "./get-property-value.js"
import { pathToRegexp } from "path-to-regexp"
import { APIRouteMethod, RoutesMeta } from "@vramework/core/types/routes.types"
import { ImportMap } from "./inspect-routes.js"

export type PathToNameAndType =  Map<string, { variable: string, type: string | null }[]>

export interface VisitState {
  typesImportMap: ImportMap,
  routesMeta: RoutesMeta,
  inputTypes: Set<string>,
  outputTypes: Set<string>,
  filesWithRoutes: Set<string>,
  singletonServicesFactories: PathToNameAndType,
  sessionServicesFactories: PathToNameAndType,
  vrameworkConfigs: PathToNameAndType
}

export const visit = (checker: ts.TypeChecker, node: ts.Node, state: VisitState) => {
    let routeValue: string | null = null
    let methodValue: string | null = null
    let params: string[] | null = []
    let queryValues: string[] | null = null
    let input: string | null = null
    let output: string | null = null

    addFileWithConfig(
      node, 
      state.vrameworkConfigs, 
      checker
    )

    addFileWithFactory(
      node,
      state.singletonServicesFactories,
      'CreateSingletonServices'
    )

    addFileWithFactory(
      node, 
      state.sessionServicesFactories, 
      'CreateSessionServices'
    )

    if (ts.isCallExpression(node)) {
      const expression = node.expression

      // Check if the call is to addRoute
      if (ts.isIdentifier(expression) && expression.text === 'addRoute') {
        state.filesWithRoutes.add(node.getSourceFile().fileName)

        const args = node.arguments
        if (args.length > 0) {
          const firstArg = args[0]

          // Check if the first argument is an object literal
          if (ts.isObjectLiteralExpression(firstArg)) {
            const obj = firstArg

            routeValue = getPropertyValue(obj, 'route') as string | null
            if (routeValue) {
              const { keys } = pathToRegexp(routeValue)
              params = keys.reduce((result, { type, name }) => {
                if (type === 'param') {
                  result.push(name)
                }
                return result
              }, [] as string[])
            }

            methodValue = getPropertyValue(obj, 'method') as string | null
            queryValues = getPropertyValue(obj, 'query') as string[] | null

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
                const returnType = checker.getReturnTypeOfSignature(signature)

                parameters.forEach((param) => {
                  const paramType = checker.getTypeOfSymbolAtLocation(
                    param,
                    param.valueDeclaration!
                  )
                  if (param.name === 'data') {
                    input = checker.typeToString(paramType)
                  }
                })

                output = checker
                  .typeToString(returnType)
                  .replace('Promise<', '')
                  .replace('>', '')
              }
            }
          }
        }
      }
    }

    if (routeValue) {
      const nullifyTypes = (type: string | null) => {
        if (
          type === 'void' ||
          type === 'undefined' ||
          type === 'unknown' ||
          type === 'any'
        ) {
          return null
        }
        return type
      }

      state.routesMeta.push({
        route: routeValue!,
        method: methodValue! as APIRouteMethod,
        input: nullifyTypes(input),
        output: nullifyTypes(output),
        params: params.length > 0 ? params : undefined,
        query: queryValues ? queryValues : undefined,
      })

      if (input) {
        state.inputTypes.add(input)
      }
      if (output) {
        state.outputTypes.add(output)
      }
    }

    ts.forEachChild(node, (child) => visit(checker, child, state))
  }