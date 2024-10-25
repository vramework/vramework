import * as ts from "typescript"
import { PathToNameAndType } from "./visit.js"

export const addFileWithFactory = (
    node: ts.Node,
    methods: PathToNameAndType = new Map(),
    expectedTypeName: string
  ) => {
    if (ts.isVariableDeclaration(node)) {
      const fileName = node.getSourceFile().fileName
      const variableType = node.type
      const variableName = node.name.getText()
  
      if (variableType && ts.isTypeReferenceNode(variableType)) {
        const typeName = variableType.typeName || null

        // Check if the type name matches the expected type name
        if (ts.isIdentifier(typeName) && typeName.text === expectedTypeName) {
          const variables = methods[fileName] || []
          variables.push({ variable: variableName, type: typeName.getText() })
          methods[fileName] = variables
        }
  
        // Handle qualified type names if necessary
        else if (ts.isQualifiedName(typeName)) {
          const lastName = typeName.right.text
          if (lastName === expectedTypeName) {
            const variables = methods[fileName] || []
            variables.push({ variable: variableName, type: typeName.getText() })
            methods[fileName] = variables
          }
        }
      }
    }
  }