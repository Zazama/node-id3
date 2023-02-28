
export const isFunction =
    // eslint-disable-next-line @typescript-eslint/ban-types
    (value: unknown): value is Function => typeof value === 'function'

export const isString = (value: unknown): value is string =>
    typeof value === 'string' || value instanceof String

export const isBuffer =
    (value: unknown): value is Buffer => value instanceof Buffer

export const deduplicate = <T>(values: T[]) => [ ...new Set(values)]

/**
 * @remarks Use only for objects defined as const when known that
 * object keyof sets are defined by the object definitions themselves.
 */
export const isKeyOf = <T extends Readonly<Record<string, unknown>>>(
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    key: keyof any,
    object: T
): key is keyof T => key in object

/**
 * Returns true when an object entry is not undefined.
 *
 * @remarks Helper to filter out entries that are undefined. The node-id3 public
 * API supports TypeScript with or without the `exactOptionalPropertyTypes`.
 * Therefore the entries that are undefined needs to be filtered out.
 *
 * @see {@link https://www.typescriptlang.org/tsconfig#exactOptionalPropertyTypes tsconfig exactOptionalPropertyTypes}
 */
export const isNotUndefinedEntry =
    (objectEntry: [string, unknown]) => objectEntry[1] !== undefined
