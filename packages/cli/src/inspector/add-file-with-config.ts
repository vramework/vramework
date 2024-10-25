import * as ts from "typescript"
import { doesTypeExtendsCore } from "./does-type-extend-core-type.js"
import { PathToNameAndType } from "./visit.js"

export const addFileWithConfig = (
    node: ts.Node,
    configs: PathToNameAndType,
    checker: ts.TypeChecker
) => {
    if (ts.isVariableDeclaration(node)) {
        const fileName = node.getSourceFile().fileName
        const variableSymbol = checker.getSymbolAtLocation(node.name)

        if (variableSymbol) {
            const variableType = checker.getTypeOfSymbolAtLocation(
                variableSymbol,
                node.name
            )
            const variableName = node.name.getText()
            const variableTypeText = node.type?.getText()

            if (doesTypeExtendsCore(variableType, checker, new Set(), 'CoreConfig')) {
                const variables = configs[fileName] || []
                variables.push({ variable: variableName, type: variableTypeText || null })
                configs[fileName] = variables
            }
        }
    }
}