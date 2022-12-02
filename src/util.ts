
export const isFunction =
    // eslint-disable-next-line @typescript-eslint/ban-types
    (value: unknown): value is Function => typeof value === 'function'

export const isString = (value: unknown): value is string =>
    typeof value === 'string' || value instanceof String
