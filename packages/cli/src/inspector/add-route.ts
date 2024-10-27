import * as ts from "typescript"
import { VisitState } from "./visit.js"
import { getPropertyValue } from "./get-property-value.js"
import { pathToRegexp } from "path-to-regexp"
import { APIRouteMethod } from "@vramework/core"

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

export const addRoute = (node: ts.Node, checker: ts.TypeChecker, state: VisitState) => {
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

    if (args.length === 0) {
        return
    }

    let methodValue: string | null = null
    let params: string[] | null = []
    let queryValues: string[] | null = null
    let inputType: string | null = null
    let outputType: string | null = null
    let routeValue: string | null = null

    state.filesWithRoutes.add(node.getSourceFile().fileName)

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

                for (const param of parameters) {
                    const paramType = checker.getTypeOfSymbolAtLocation(
                        param,
                        param.valueDeclaration!
                    )

                    if (param.name === 'data') {
                        inputType = checker.typeToString(paramType)
                    }
                }

                outputType = checker
                    .typeToString(returnType)
                    .replace('Promise<', '')
                    .replace('>', '')
            }
        }

        if (!routeValue) {
            return
        }

        state.routesMeta.push({
            route: routeValue!,
            method: methodValue! as APIRouteMethod,
            input: nullifyTypes(inputType),
            output: nullifyTypes(outputType),
            params: params.length > 0 ? params : undefined,
            query: queryValues ? queryValues : undefined,
        })

        if (inputType) {
            state.inputTypes.add(inputType)
        }

        if (outputType) {
            state.outputTypes.add(outputType)
        }
    }
}