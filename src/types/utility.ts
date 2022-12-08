export type Values<T extends Record<string, unknown>> = T[keyof T]
