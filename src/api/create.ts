import { WriteTags } from "../types/Tags"
import { isFunction } from  "../util"
import { createId3Tag } from "../id3-tag"

/**
 * Callback used to return a buffer with the created ID Tag.
 *
 * @public
 */
export type CreateCallback =
    (data: Buffer) => void

/**
 * Creates a buffer containing an ID3 Tag and returns it.
 *
 * @public
 */
export function create(tags: WriteTags): Buffer

/**
 * Creates a buffer containing an ID3 Tag and returns it via the callback.
 *
 * @public
 */
export function create(tags: WriteTags, callback: CreateCallback): void

export function create(tags: WriteTags, callback?: CreateCallback) {
    const id3Data = createId3Tag(tags)
    if (isFunction(callback)) {
        return callback(id3Data)
    }
    return id3Data
}
