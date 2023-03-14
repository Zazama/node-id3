import * as ID3Util from "../ID3Util"
import { WriteTags } from "../types/Tags"
import { isFunction } from  "../util"
import { createBufferFromTags } from "../TagsHelpers"

/**
 * Callback used to return a created ID Tag buffer.
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
    const frames = createBufferFromTags(tags)

    //  Create ID3 header
    const header = Buffer.alloc(10)
    header.fill(0)
    header.write("ID3", 0)              //File identifier
    header.writeUInt16BE(0x0300, 3)     //Version 2.3.0  --  03 00
    header.writeUInt16BE(0x0000, 5)     //Flags 00
    ID3Util.encodeSize(frames.length).copy(header, 6)

    const id3Data = Buffer.concat([header, frames])

    if (isFunction(callback)) {
        return callback(id3Data)
    }
    return id3Data
}
