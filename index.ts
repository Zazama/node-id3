/**
 * An ID3-Tag library written in Typescript.
 *
 * @remarks
 *
 * This library (partially, still work in progress) implements
 * {@link http://id3.org/id3v2.3.0 | id3.org v2.3.0} specifications.
 *
 * ## Errors
 *
 * The library may throw in various cases.
 *
 * - file operations may throw, refer to [Node.js](https://nodejs.org/)
 *   File System API documentation
 *   for more information
 * - tags are partially validated and the API will throw when the first
 *   validation fails, there is maybe more issues after this one
 * - read operations will ignore frames with decoding errors, i.e. frames which
 *  do not comply to the specification
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
