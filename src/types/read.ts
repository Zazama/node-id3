import { FileOptions } from "./FileOptions"
import { Options } from "./Options"
import { TagIdentifiers, Tags } from "./Tags"

/**
 * Callback signature for successful asynchronous read operation.
 *
 * @param tags - `TagsIdentifiers` if the `rawOnly` option was true otherwise
 *               `Tags`
 * @public
 */
export type ReadSuccessCallback =
    (error: null, tags: Tags | TagIdentifiers) => void

/**
 * Callback signatures for failing asynchronous read operation.
 *
 * @public
 */
export type ReadErrorCallback =
    (error: NodeJS.ErrnoException | Error, tags: null) => void

/**
 * Callback signatures for asynchronous read operation.
 *
 * @public
 */
export type ReadCallback =
    ReadSuccessCallback & ReadErrorCallback

export type FileReadOptions = FileOptions & Options