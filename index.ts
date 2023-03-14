/**
 * An ID3-Tag library written in Typescript.
 *
 * @remarks
 *
 * Used specification: {@link http://id3.org/id3v2.3.0 | id3.org v2.3.0}.
 *
 * @packageDocumentation
 */

export * from "./src/types/Tags"
export * from "./src/types/Options"

export * from './src/definitions/TagConstants'

export * from "./src/api/create"
export * from "./src/api/read"
export * from "./src/api/remove"
export * from "./src/api/update"
export * from "./src/api/write"
export * from "./src/api/promises"
