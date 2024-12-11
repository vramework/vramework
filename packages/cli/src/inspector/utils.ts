import * as ts from 'typescript'

const isValidVariableName = (name: string) => {
  const regex = /^[a-zA-Z_$][a-zA-Z0-9_$]*$/
  return regex.test(name)
}

export const resolveUnionTypes = (
  checker: ts.TypeChecker,
  type: ts.Type
): { types: ts.Type[]; names: string[] } => {
  const types: ts.Type[] = []
  const names: string[] = []

  // Check if it's a union type AND not part of an intersection
  if (type.isUnion() && !(type.flags & ts.TypeFlags.Intersection)) {
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

// This allows aliases to be preserved
const getType = (checker: ts.TypeChecker, node: ts.Node) => {
  return checker.getTypeAtLocation(node)
  // const symbol = checker.getSymbolAtLocation(node)
  // if (symbol) {
  //   return checker.getDeclaredTypeOfSymbol(symbol);
  // } 
  // throw new Error('No symbol found')
}

export const getTypeOfFunctionArg = (
  checker: ts.TypeChecker,
  funcProperty: ts.ObjectLiteralElementLike | undefined,
  argIndex: number
) => {
  if (funcProperty && ts.isPropertyAssignment(funcProperty)) {
    const funcType = getType(checker, funcProperty.initializer)
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
    subFunctionName = funcName,
    inputIndex,
    outputIndex,
    inputTypeSet,
    outputTypeSet,
    customAliasedTypes,
  }: {
    subFunctionName?: string
    funcName: string
    inputIndex: number
    outputIndex: number
    inputTypeSet: Set<string>
    outputTypeSet: Set<string>
    customAliasedTypes?: Map<string, string>
  }
): FunctionTypes => {
  const result: FunctionTypes = {
    inputTypes: [],
    inputs: null,
    outputTypes: [],
    outputs: null,
  }

  const property = getPropertyAssignment(obj, subFunctionName)
  if (!property) {
    return result
  }

  let type: ts.Type | undefined

  // Handle shorthand property assignment
  if (ts.isShorthandPropertyAssignment(property)) {
    const symbol = checker.getShorthandAssignmentValueSymbol(property)
    if (symbol) {
      type = checker.getTypeOfSymbolAtLocation(symbol, property)
      if (funcName === 'func') {
        funcName = symbol.name
      }
    }
  }
  // Handle regular property assignment
  else if (ts.isPropertyAssignment(property)) {
    if (ts.isObjectLiteralExpression(property.initializer)) {
      return getFunctionTypes(checker, property.initializer, {
        funcName,
        subFunctionName: 'func',
        inputIndex,
        outputIndex,
        inputTypeSet,
        outputTypeSet,
        customAliasedTypes,
      })
    }

    if (property.initializer) {
      type = getType(checker, property.initializer)
      if (funcName === 'func') {
        funcName = property.initializer.getText()
      }
    }
  }

  if (!type) {
    console.error(`Unable to resolve type for property '${funcName}'`)
    return result
  }

  // Access type arguments from TypeReference
  const typeArguments = getTypeArgumentsOfType(checker, type)

  if (!typeArguments || typeArguments.length === 0) {
    // This is the case for inline functions. In this case we would want to
    // get the types from the second argument of the function...
    console.error(`\x1b[31m• No generic type arguments found for ${funcName}. Support for inline functions is not yet implemented.\x1b[0m`)
    return result
  }

  if (inputIndex !== undefined && inputIndex < typeArguments.length) {
    const types = resolveUnionTypes(checker, typeArguments[inputIndex]!)
    const firstName = types.names[0]
    if (customAliasedTypes && (types.names.length > 1 || (firstName && !isValidVariableName(firstName)))) {
      const aliasType = types.names.join(' | ')
      const aliasName = `${funcName.charAt(0).toUpperCase()}${funcName.slice(1)}Input`
      customAliasedTypes.set(aliasName, aliasType)
      result.inputs = [aliasName]
      inputTypeSet.add(aliasName)
      result.inputTypes = types.types
    } else {
      result.inputs = types.names
      result.inputs.forEach((input) => inputTypeSet.add(input))
      result.inputTypes = types.types
    }
  } else {
    console.error(`Input index ${inputIndex} is out of bounds`)
  }

  if (outputIndex !== undefined && outputIndex < typeArguments.length) {
    const types = resolveUnionTypes(checker, typeArguments[outputIndex]!)
    const firstName = types.names[0]
    if (customAliasedTypes && (types.names.length > 1 || (firstName && !isValidVariableName(firstName)))) {
      const aliasType = types.names.join(' | ')
      const aliasName = `${funcName.charAt(0).toUpperCase()}${funcName.slice(1)}Output`
      customAliasedTypes.set(aliasName, aliasType)
      result.outputs = [aliasName]
      outputTypeSet.add(aliasName)
      result.outputTypes = types.types
    } else {
      result.outputs = types.names
      result.outputs.forEach((output) => outputTypeSet.add(output))
      result.outputTypes = types.types
    }
  }

  return result
}

export const getFunctionTypesSimple = (
  checker: ts.TypeChecker,
  funcProperty: ts.ObjectLiteralElementLike
) => {
  let inputType: string | null = null
  let outputType: string | null = null
  let paramType: ts.Type | null = null

  if (funcProperty && ts.isPropertyAssignment(funcProperty)) {
    // Get the type of the 'func' expression
    const funcType = getType(checker, funcProperty.initializer)

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
