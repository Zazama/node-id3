import { FileOptions } from "./FileOptions"

/**
 * Callback signatures for asynchronous update and write operations.
 * `null` indicated success.
 *
 * @public
 */
export type WriteCallback =
    (error: NodeJS.ErrnoException | Error | null) => void

export type WriteOptions = FileOptions & {
    // TODO: add padding options
}
