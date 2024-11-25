import * as ts from 'typescript'

export const getTypeOfFunctionArg = (
  checker: ts.TypeChecker,
  funcProperty: ts.ObjectLiteralElementLike | undefined,
  argIndex: number
) => {
  if (funcProperty && ts.isPropertyAssignment(funcProperty)) {
    const funcExpression = funcProperty.initializer
    const funcType = checker.getTypeAtLocation(funcExpression)
    const callSignatures = funcType.getCallSignatures()

    if (callSignatures.length > 1) {
      console.error('Multiple call signatures found for stream')
    }

    const signature = callSignatures[0]
    if (!signature) {
      console.log('No api signature found for stream')
      return null
    }
    const parameters = signature.getParameters()
    const parameter = parameters[argIndex]
    if (!parameter) {
      console.log('No parameter found for stream')
      return null
    }
    const paramType = checker.getTypeOfSymbolAtLocation(
      parameter,
      parameter.valueDeclaration!
    )
    return checker.typeToString(paramType)
  }
  return null
}

export const getFunctionTypes = (
  checker: ts.TypeChecker,
  funcProperty: ts.ObjectLiteralElementLike
) => {
  let inputType: string | null = null
  let outputType: string | null = null
  let paramType: ts.Type | null = null

  if (funcProperty && ts.isPropertyAssignment(funcProperty)) {
    const funcExpression = funcProperty.initializer

    // Get the type of the 'func' expression
    const funcType = checker.getTypeAtLocation(funcExpression)

    // Get the call signatures of the function type
    const callSignatures = funcType.getCallSignatures()

    if (callSignatures.length > 1) {
      console.error('Multiple call signatures found')
    }

    const signature = callSignatures[0]

    if (!signature) {
      console.error('No call signatures found')
      return { inputType: null, outputType: null, paramType: null }
    }

    const parameters = signature.getParameters()
    const returnType = checker.getReturnTypeOfSignature(signature)

    const dataParameter = parameters[1]
    if (!dataParameter) {
      console.error('No data parameter found')
      return { inputType: null, outputType: null, paramType: null }
    }
    const paramType = checker.getTypeOfSymbolAtLocation(
      dataParameter,
      dataParameter.valueDeclaration!
    )
    inputType = checker.typeToString(paramType)
    outputType = checker
      .typeToString(returnType)
      .replace('Promise<', '')
      .replace('>', '')
  }

  return {
    inputType: nullifyTypes(inputType),
    outputType: nullifyTypes(outputType),
    paramType,
  }
}

export const extractTypeKeys = (type: ts.Type): string[] => {
  return type.getProperties().map((symbol) => symbol.getName())
}

export const nullifyTypes = (type: string | null) => {
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
