import * as ts from 'typescript'
import { pathToRegexp } from 'path-to-regexp'
import { APIRouteMethod, RoutesMeta } from '@vramework/core/types/routes.types'
import { getFileImportRelativePath } from './utils.js'

export interface ImportInfo {
  importPath: string
  namedImports: Set<string>
}

export type ImportMap = Map<string, ImportInfo>

const getPropertyValue = (
  obj: ts.ObjectLiteralExpression,
  propertyName: string
): string | string[] | null => {
  const property = obj.properties.find(
    (p) =>
      ts.isPropertyAssignment(p) &&
      ts.isIdentifier(p.name) &&
      p.name.text === propertyName
  )

  if (property && ts.isPropertyAssignment(property)) {
    const initializer = property.initializer

    // Special handling for 'query' -> expect an array of strings
    if (propertyName === 'query' && ts.isArrayLiteralExpression(initializer)) {
      const stringArray = initializer.elements
        .map((element) => {
          if (ts.isStringLiteral(element)) {
            return element.text
          }
          return null
        })
        .filter((item) => item !== null) as string[] // Filter non-null and assert type

      return stringArray.length > 0 ? stringArray : null
    }

    // Handle string literals for other properties
    if (
      ts.isStringLiteral(initializer) ||
      ts.isNoSubstitutionTemplateLiteral(initializer)
    ) {
      return initializer.text
    } else {
      // Handle other initializer types if necessary
      return initializer.getText()
    }
  }

  return null
}

function addFileWithFactory(
  node: ts.Node,
  methods: Record<string, string[]> = {},
  expectedTypeName: string
) {
  if (ts.isVariableDeclaration(node)) {
    const fileName = node.getSourceFile().fileName
    const variableType = node.type
    const variableName = node.name.getText()

    if (variableType && ts.isTypeReferenceNode(variableType)) {
      const typeName = variableType.typeName

      // Check if the type name matches the expected type name
      if (ts.isIdentifier(typeName) && typeName.text === expectedTypeName) {
        const variables = methods[fileName] || []
        variables.push(variableName)
        methods[fileName] = variables
      }

      // Handle qualified type names if necessary
      else if (ts.isQualifiedName(typeName)) {
        const lastName = typeName.right.text
        if (lastName === expectedTypeName) {
          const variables = methods[fileName] || []
          variables.push(variableName)
          methods[fileName] = variables
        }
      }
    }
  }
}

function addVariableWithTypeExtendingCoreConfig(
  node: ts.Node,
  configs: Record<string, string[]>,
  checker: ts.TypeChecker
) {
  if (ts.isVariableDeclaration(node)) {
    const fileName = node.getSourceFile().fileName
    const variableSymbol = checker.getSymbolAtLocation(node.name)

    if (variableSymbol) {
      const variableType = checker.getTypeOfSymbolAtLocation(
        variableSymbol,
        node.name
      )
      const variableName = node.name.getText()

      if (doesTypeExtendCoreConfig(variableType, checker, new Set())) {
        const variables = configs[fileName] || []
        variables.push(variableName)
        configs[fileName] = variables
      }
    }
  }
}

function doesTypeExtendCoreConfig(
  type: ts.Type,
  checker: ts.TypeChecker,
  visitedTypes: Set<ts.Type>
): boolean {
  if (!type || !checker) return false

  // Avoid infinite recursion by checking if we've already visited this type
  if (visitedTypes.has(type)) {
    return false
  }
  visitedTypes.add(type)

  const typeSymbol = type.getSymbol()
  if (typeSymbol) {
    // Check if the type is 'CoreConfig' itself
    if (typeSymbol.getName() === 'CoreConfig') {
      return true
    }

    // For interface and class types, check their base types
    if (type.isClassOrInterface()) {
      const baseTypes = type.getBaseTypes() || []
      for (const baseType of baseTypes) {
        if (doesTypeExtendCoreConfig(baseType, checker, visitedTypes)) {
          return true
        }
      }
    }
  }

  // For type aliases, get the aliased type
  if (type.aliasSymbol) {
    const aliasedType = checker.getDeclaredTypeOfSymbol(type.aliasSymbol)
    if (doesTypeExtendCoreConfig(aliasedType, checker, visitedTypes)) {
      return true
    }
  }

  // For union and intersection types, check all constituent types
  if (type.isUnionOrIntersection()) {
    for (const subType of type.types) {
      if (doesTypeExtendCoreConfig(subType, checker, visitedTypes)) {
        return true
      }
    }
  }

  return false
}

export const inspectRoutes = (
  outputFile: string,
  routeFiles: string[],
  packageMappings: Record<string, string> = {}
) => {
  const typesImportMap: ImportMap = new Map()
  const routesMeta: RoutesMeta = []
  const filesWithRoutes = new Set<string>()
  const singletonServicesFactories: Record<string, string[]> = {}
  const sessionServicesFactories: Record<string, string[]> = {}
  const vrameworkConfigs: Record<string, string[]> = {}

  const program = ts.createProgram(routeFiles, {
    target: ts.ScriptTarget.ESNext,
    module: ts.ModuleKind.CommonJS,
  })
  const checker = program.getTypeChecker()
  const sourceFiles = program.getSourceFiles()

  function findSymbolFile(symbolName: string): string | null {
    for (const sourceFile of program.getSourceFiles()) {
      if (sourceFile.isDeclarationFile) {
        continue
      }
      const symbols = checker.getSymbolsInScope(
        sourceFile,
        ts.SymbolFlags.Function |
          ts.SymbolFlags.TypeAlias |
          ts.SymbolFlags.Interface |
          ts.SymbolFlags.Class
      )
      for (const symbol of symbols) {
        if (symbol.getName() === symbolName) {
          const declarations = symbol.getDeclarations()
          if (declarations && declarations.length > 0) {
            let filePath = getFileImportRelativePath(
              outputFile,
              declarations[0].getSourceFile().fileName,
              packageMappings
            )
            const importInfo = typesImportMap.get(filePath) || {
              importPath: filePath,
              namedImports: new Set(),
            }
            importInfo.namedImports.add(symbol.getName())
            typesImportMap.set(filePath, importInfo)
          }
        }
      }
    }
    return null
  }

  for (const sourceFile of sourceFiles) {
    ts.forEachChild(sourceFile, (child) => visit(child))
  }

  function visit(node: ts.Node) {
    let routeValue: string | null = null
    let methodValue: string | null = null
    let params: string[] | null = []
    let queryValues: string[] | null = null
    let input: string | null = null
    let output: string | null = null

    addVariableWithTypeExtendingCoreConfig(node, vrameworkConfigs, checker)
    addFileWithFactory(
      node,
      singletonServicesFactories,
      'CreateSingletonServices'
    )
    addFileWithFactory(node, sessionServicesFactories, 'CreateSessionServices')

    if (ts.isCallExpression(node)) {
      const expression = node.expression

      // Check if the call is to addRoute
      if (ts.isIdentifier(expression) && expression.text === 'addRoute') {
        filesWithRoutes.add(node.getSourceFile().fileName)

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

      routesMeta.push({
        route: routeValue!,
        method: methodValue! as APIRouteMethod,
        input: nullifyTypes(input),
        output: nullifyTypes(output),
        params: params.length > 0 ? params : undefined,
        query: queryValues ? queryValues : undefined,
      })

      if (input) {
        findSymbolFile(input)
      }
      if (output) {
        findSymbolFile(output)
      }
    }
    ts.forEachChild(node, (child) => visit(child))
  }

  return {
    routesMeta,
    typesImportMap,
    routesOutputPath: outputFile,
    filesWithRoutes: [...filesWithRoutes],
    sessionServicesFactories,
    singletonServicesFactories,
    vrameworkConfigs,
  }
}
