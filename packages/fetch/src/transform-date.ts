export const transformDates = (data: any) => {
    if (data === null) return null;
    if (Array.isArray(data)) return data.map(transformDates.bind(this));
    if (typeof data === 'object') {
        return Object.entries(data).reduce((result, [key, value]) => {
            result[key] = transformDates(value);
            return result;
        }, {} as any);
    }
    if (typeof data === 'string' && /^\d{4}-\d{2}-\d{2}(T\d{2}:\d{2}:\d{2}.\d{3}Z?)?/.test(data)) {
        return new Date(data);
    }
    return data;
}