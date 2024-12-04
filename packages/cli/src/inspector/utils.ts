import * as ts from 'typescript'

export const resolveUnionTypes = (
  checker: ts.TypeChecker,
  type: ts.Type
): { types: ts.Type[]; names: string[] } => {
  const types: ts.Type[] = []
  const names: string[] = []

  if (type.isUnion()) {
    for (const t of type.types) {
      const name = nullifyTypes(checker.typeToString(t))
      if (name) {
        types.push(t)
        names.push(name)
      }
    }
  } else {
    const name = nullifyTypes(checker.typeToString(type))
    if (name) {
      types.push(type)
      names.push(name)
    }
  }

  return { types, names }
}

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
      console.error('Multiple call signatures found')
    }

    const signature = callSignatures[0]
    if (!signature) {
      console.log('No api signature found')
      return null
    }
    const parameters = signature.getParameters()
    const parameter = parameters[argIndex]
    if (!parameter) {
      console.log('No parameter found')
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

export const getPropertyAssignment = (
  obj: ts.ObjectLiteralExpression,
  name: string
) => {
  const property = obj.properties.find(
    (p) =>
      (ts.isPropertyAssignment(p) || ts.isShorthandPropertyAssignment(p)) &&
      ts.isIdentifier(p.name) &&
      p.name.text === name
  )
  if (!property) {
    console.error(`Missing property '${name}' in object`)
    return null
  }
  return property
}

export const getTypeArgumentsOfType = (
  checker: ts.TypeChecker,
  type: ts.Type
): readonly ts.Type[] | null => {
  // If the type is a union or intersection, collect type arguments from its constituent types
  if (type.isUnionOrIntersection()) {
    const types: ts.Type[] = []
    for (const subType of type.types) {
      const subTypeArgs = getTypeArgumentsOfType(checker, subType)
      if (subTypeArgs) {
        types.push(...subTypeArgs)
      }
    }
    return types.length > 0 ? types : null
  }

  // If the type is a TypeReference with typeArguments, return them
  if (
    type.flags & ts.TypeFlags.Object &&
    (type as ts.ObjectType).objectFlags & ts.ObjectFlags.Reference
  ) {
    const typeRef = type as ts.TypeReference
    if (typeRef.typeArguments && typeRef.typeArguments.length > 0) {
      return typeRef.typeArguments
    }
  }

  // If the type is an alias with aliasTypeArguments, return them
  if (type.aliasTypeArguments && type.aliasTypeArguments.length > 0) {
    return type.aliasTypeArguments as ts.Type[]
  }

  return null
}

type FunctionTypes = {
  inputTypes: ts.Type[]
  inputs: null | string[]
  outputTypes: ts.Type[]
  outputs: null | string[]
}
export const getFunctionTypes = (
  checker: ts.TypeChecker,
  obj: ts.ObjectLiteralExpression,
  {
    funcName,
    inputIndex,
    outputIndex,
  }: { funcName: string; inputIndex: number; outputIndex: number }
): FunctionTypes => {
  const result: FunctionTypes = {
    inputTypes: [],
    inputs: null,
    outputTypes: [],
    outputs: null,
  }

  const property = getPropertyAssignment(obj, funcName)
  if (!property) {
    return result
  }

  let type: ts.Type | undefined

  // Handle shorthand property assignment
  if (ts.isShorthandPropertyAssignment(property)) {
    const symbol = checker.getShorthandAssignmentValueSymbol(property)
    if (symbol) {
      type = checker.getTypeOfSymbolAtLocation(symbol, property)
    }
  }
  // Handle regular property assignment
  else if (ts.isPropertyAssignment(property)) {
    if (ts.isObjectLiteralExpression(property.initializer)) {
      return getFunctionTypes(checker, property.initializer, {
        funcName: 'func',
        inputIndex,
        outputIndex,
      })
    }

    if (property.initializer) {
      type = checker.getTypeAtLocation(property.initializer)
    }
  }

  if (!type) {
    console.error(`Unable to resolve type for property '${funcName}'`)
    return result
  }

  // Access type arguments from TypeReference
  const typeArguments = getTypeArgumentsOfType(checker, type)

  if (!typeArguments || typeArguments.length === 0) {
    console.error('No generic type arguments found', typeArguments?.length)
    return result
  }

  if (inputIndex !== undefined && inputIndex < typeArguments.length) {
    const types = resolveUnionTypes(checker, typeArguments[inputIndex]!)
    result.inputs = types.names
    result.inputTypes = types.types
  } else {
    console.error(`Input index ${inputIndex} is out of bounds`)
  }

  if (outputIndex !== undefined && outputIndex < typeArguments.length) {
    const types = resolveUnionTypes(checker, typeArguments[outputIndex]!)
    result.outputs = types.names
    result.outputTypes = types.types
  } else {
    console.error(
      `Output index ${outputIndex} is out of bounds for ${funcName}`
    )
  }

  return result
}

export const getFunctionTypes_old = (
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
    if (dataParameter) {
      paramType = checker.getTypeOfSymbolAtLocation(
        dataParameter,
        dataParameter.valueDeclaration!
      )
      inputType = checker.typeToString(paramType)
    }
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
