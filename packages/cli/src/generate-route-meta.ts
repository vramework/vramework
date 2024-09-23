import * as ts from 'typescript';
import * as path from 'path';

interface ImportInfo {
  importPath: string;
  namedImports: Set<string>;
}

export const generateRouteMeta = (outputFile: string, routeFiles: string[]) => {
  const importMap: Map<string, ImportInfo> = new Map();
  
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
            const decl = declarations[0];
            const filePath = path.relative(outputFile, decl.getSourceFile().fileName)
            const importInfo = importMap.get(filePath) || { importPath: filePath, namedImports: new Set() }
            importInfo.namedImports.add(symbol.getName())
            importMap.set(filePath, importInfo)
          }
        }
      }
    }
    return null;
  }

  const checker = program.getTypeChecker();

  const routesMeta: Array<{
    route: string
    method: string
    input: string | null,
    output: string | null
  }> = []

  const sourceFiles = program.getSourceFiles()

  for (const sourceFile of sourceFiles) {
    ts.forEachChild(sourceFile, (child) => visit(child));
  }

  function visit(node: ts.Node) {
    let routeValue: string | null = null;
    let methodValue: string | null = null;
    let input: string | null = null;
    let output: string | null = null;

    if (ts.isCallExpression(node)) {
      const expression = node.expression;

      // Check if the call is to addRoute
      if (ts.isIdentifier(expression) && expression.text === 'addRoute') {
        const args = node.arguments;
        if (args.length > 0) {
          const firstArg = args[0];

          // Check if the first argument is an object literal
          if (ts.isObjectLiteralExpression(firstArg)) {
            const obj = firstArg;
            // Extract the 'route' property
            const routeProperty = obj.properties.find(
              (p) =>
                ts.isPropertyAssignment(p) &&
                ts.isIdentifier(p.name) &&
                p.name.text === 'route'
            );

            const methodProperty = obj.properties.find(
              (p) =>
                ts.isPropertyAssignment(p) &&
                ts.isIdentifier(p.name) &&
                p.name.text === 'method'
            );

            if (routeProperty && ts.isPropertyAssignment(routeProperty)) {
              const initializer = routeProperty.initializer;
              if (ts.isStringLiteral(initializer) || ts.isNoSubstitutionTemplateLiteral(initializer)) {
                routeValue = initializer.text;
              } else {
                // Handle other initializer types if necessary
                routeValue = initializer.getText();
              }
            }

            if (methodProperty && ts.isPropertyAssignment(methodProperty)) {
              const initializer = methodProperty.initializer;
              if (ts.isStringLiteral(initializer) || ts.isNoSubstitutionTemplateLiteral(initializer)) {
                methodValue = initializer.text;
              } else {
                // Handle other initializer types if necessary
                methodValue = initializer.getText();
              }
            }

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
        method: methodValue!, 
        input: nullifyTypes(input), 
        output: nullifyTypes(output)
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

  let imports = ''
  for (const [importPath, { namedImports }] of importMap) {
    imports += `import { ${Array.from(namedImports).join(', ')} } from '../${importPath.replace('.ts', '')}'\n`
  }

  let routesInterface = `${imports}\n\nexport type RoutesInterface = `
  const result = routesMeta.map(({ route, method, input, output }) => `{ route: '${route}', method: '${method}', input: ${input}, output: ${output} }`)
  routesInterface += result.join(' |\n\t')

  return {
    routesMeta,
    routesInterface,
  }
};
