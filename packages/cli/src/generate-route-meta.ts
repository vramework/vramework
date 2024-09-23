import * as ts from 'typescript';

export const generateRouteMeta = (fileNames: string[]) => {
  const program = ts.createProgram(fileNames, {
    target: ts.ScriptTarget.ESNext,
    module: ts.ModuleKind.CommonJS,
  });

  const checker = program.getTypeChecker();

  const routeMappings: Record<string, {
    input: string | null,
    output: string | null
  }> = {}

  const sourceFiles = program.getSourceFiles().filter((sf) => {
    const filePath = sf.fileName;
    return !filePath.includes('node_modules') && !filePath.endsWith('.d.ts');
  });

  for (const sourceFile of sourceFiles) {
    ts.forEachChild(sourceFile, (child) => visit(child));
  }

  function visit(node: ts.Node) {
    let routeValue: string | null = null;
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


            if (routeProperty && ts.isPropertyAssignment(routeProperty)) {
              const initializer = routeProperty.initializer;
              if (ts.isStringLiteral(initializer) || ts.isNoSubstitutionTemplateLiteral(initializer)) {
                routeValue = initializer.text;
              } else {
                // Handle other initializer types if necessary
                routeValue = initializer.getText();
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
      routeMappings[routeValue] = { 
        input: nullifyTypes(input), 
        output: nullifyTypes(output)
      };
    }
    ts.forEachChild(node, (child) => visit(child));
  }

  return routeMappings
};