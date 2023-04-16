import { WriteTags } from "../types/Tags"
import { createId3Tag } from "../id3-tag"

/**
 * Creates a buffer containing an ID3 Tag and returns it.
 *
 * @public
 */
export function create(tags: WriteTags): Buffer {
    return createId3Tag(tags)
}
