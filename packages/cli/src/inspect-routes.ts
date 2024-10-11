import * as ts from 'typescript';
import { pathToRegexp } from 'path-to-regexp'
import { getFileImportRelativePath } from './utils';
import { APIRouteMethod, RoutesMeta } from '@vramework/core/types/routes.types';

export interface ImportInfo {
  importPath: string;
  namedImports: Set<string>;
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
  );

  if (property && ts.isPropertyAssignment(property)) {
    const initializer = property.initializer;

    // Special handling for 'query' -> expect an array of strings
    if (propertyName === 'query' && ts.isArrayLiteralExpression(initializer)) {
      const stringArray = initializer.elements.map((element) => {
        if (ts.isStringLiteral(element)) {
          return element.text;
        }
        return null;
      }).filter((item) => item !== null) as string[]; // Filter non-null and assert type

      return stringArray.length > 0 ? stringArray : null;
    }

    // Handle string literals for other properties
    if (ts.isStringLiteral(initializer) || ts.isNoSubstitutionTemplateLiteral(initializer)) {
      return initializer.text;
    } else {
      // Handle other initializer types if necessary
      return initializer.getText();
    }
  }

  return null;
};

export const inspectRoutes = (outputFile: string, routeFiles: string[], packageMappings: Record<string, string> = {}) => {
  const typesImportMap: ImportMap = new Map();
  const routesMeta: RoutesMeta = []
  const filesWithRoutes = new Set<string>()

  const program = ts.createProgram(routeFiles, {
    target: ts.ScriptTarget.ESNext,
    module: ts.ModuleKind.CommonJS,
  });

  function findSymbolFile(symbolName: string): string | null {
    for (const sourceFile of program.getSourceFiles()) {
      if (sourceFile.isDeclarationFile) continue;
      const symbols = checker.getSymbolsInScope(sourceFile, ts.SymbolFlags.Function | ts.SymbolFlags.TypeAlias | ts.SymbolFlags.Interface | ts.SymbolFlags.Class);
      for (const symbol of symbols) {
        if (symbol.getName() === symbolName) {
          const declarations = symbol.getDeclarations();
          if (declarations && declarations.length > 0) {
            let filePath = getFileImportRelativePath(outputFile , declarations[0].getSourceFile().fileName, packageMappings)
            const importInfo = typesImportMap.get(filePath) || { importPath: filePath, namedImports: new Set() }
            importInfo.namedImports.add(symbol.getName())
            typesImportMap.set(filePath, importInfo)
          }
        }
      }
    }
    return null;
  }

  const checker = program.getTypeChecker();
  const sourceFiles = program.getSourceFiles()

  for (const sourceFile of sourceFiles) {
    ts.forEachChild(sourceFile, (child) => visit(child));
  }

  function visit(node: ts.Node) {
    let routeValue: string | null = null;
    let methodValue: string | null = null;
    let params: string[] | null = [];
    let queryValues: string[] | null = null;
    let input: string | null = null;
    let output: string | null = null;

    if (ts.isCallExpression(node)) {
      const expression = node.expression;

      // Check if the call is to addRoute
      if (ts.isIdentifier(expression) && expression.text === 'addRoute') {
        filesWithRoutes.add(node.getSourceFile().fileName);

        const args = node.arguments;
        if (args.length > 0) {
          const firstArg = args[0];

          // Check if the first argument is an object literal
          if (ts.isObjectLiteralExpression(firstArg)) {
            const obj = firstArg;

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
            );

            if (funcProperty && ts.isPropertyAssignment(funcProperty)) {
              const funcExpression = funcProperty.initializer;

              // Get the type of the 'func' expression
              const funcType = checker.getTypeAtLocation(funcExpression);

              // Get the call signatures of the function type
              const callSignatures = funcType.getCallSignatures();

              for (const signature of callSignatures) {
                const parameters = signature.getParameters();
                const returnType = checker.getReturnTypeOfSignature(signature);

                parameters.forEach((param) => {
                  const paramType = checker.getTypeOfSymbolAtLocation(
                    param,
                    param.valueDeclaration!
                  );
                  if (param.name === 'data') {
                    input = checker.typeToString(paramType)
                  }
                });

                output = checker.typeToString(returnType).replace('Promise<', '').replace('>', '');
              }
            }
          }
        }
      }
    }

    if (routeValue) {
      const nullifyTypes = (type: string | null) => {
        if (type === 'void' || type === 'undefined' || type === 'unknown' || type === 'any') {
          return null;
        }
        return type
      }

      routesMeta.push({
        route: routeValue!,
        method: methodValue! as APIRouteMethod, 
        input: nullifyTypes(input),
        output: nullifyTypes(output),
        params: params.length > 0 ? params : undefined,
        query: queryValues ? queryValues : undefined
      })

      if (input) {
        findSymbolFile(input)
      }
      if (output) {
        findSymbolFile(output)
      }
    }
    ts.forEachChild(node, (child) => visit(child));
  }

  return {
    routesMeta,
    typesImportMap,
    filesWithRoutes: [...filesWithRoutes]
  }
};
