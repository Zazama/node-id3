/**
 * Callback signatures for asynchronous update and write operations.
 * `null` indicated success.
 *
 * @public
 */
export type WriteCallback =
    (error: NodeJS.ErrnoException | Error | null) => void

/**
 * Options for write operations.
 *
 * @public
 */
export type WriteOptions = {
    /**
     * File buffer size in bytes.
     */
    fileBufferSize?: number
}
