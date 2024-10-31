/**
 * The `transformDates` function recursively traverses an object or array and converts any date-like strings
 * into JavaScript `Date` objects. This helps in ensuring that date fields are properly handled as `Date` instances
 * rather than strings.
 *
 * @private
 * @param {any} data - The input data that may contain date strings. It can be an object, array, or primitive value.
 * @returns {any} - The transformed data with date strings converted to `Date` objects.
 */
export const transformDates = (data: any) => {
  if (data === null) return null
  if (Array.isArray(data)) return data.map(transformDates.bind(this))
  if (typeof data === 'object') {
    return Object.entries(data).reduce((result, [key, value]) => {
      result[key] = transformDates(value)
      return result
    }, {} as any)
  }
  if (
    typeof data === 'string' &&
    /^\d{4}-\d{2}-\d{2}(T\d{2}:\d{2}:\d{2}\.\d{3}Z?)?/.test(data)
  ) {
    return new Date(data)
  }
  return data
}
