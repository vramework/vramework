import * as ts from "typescript"

export const getPropertyValue = (
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
  