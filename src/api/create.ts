import * as ID3Util from "../ID3Util"
import { WriteTags } from "../types/Tags"
import { isFunction } from  "../util"
import { createBufferFromTags } from "../TagsHelpers"

export type CreateCallback =
    (data: Buffer) => void

/**
 * Creates a buffer containing the ID3 Tag
 */
export function create(tags: WriteTags): Buffer
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
