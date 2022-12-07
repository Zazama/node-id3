
export const isFunction =
    // eslint-disable-next-line @typescript-eslint/ban-types
    (value: unknown): value is Function => typeof value === 'function'

export const isString = (value: unknown): value is string =>
    typeof value === 'string' || value instanceof String

export const isKeyOf = <T extends Record<string, unknown>>(
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    key: keyof any,
    object: T
): key is keyof T => key in object
