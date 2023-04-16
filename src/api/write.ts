import { WriteTags } from "../types/Tags"
import { WriteCallback } from "../types/write"
import { create }  from "./create"
import { removeTagsFromBuffer } from "./remove"
import { isFunction, isString, validateString } from "../util"
import { writeId3TagToFileAsync, writeId3TagToFileSync } from "../file-write"

/**
 * Replaces any existing tags with the given tags in the given buffer.
 * Throws in case of error.
 * @public
 */
export function write(tags: WriteTags, buffer: Buffer): Buffer

/**
 * Replaces synchronously any existing tags with the given tags in the
 * specified file.
 * Throws in case of error.
 * @public
 */
export function write(tags: WriteTags, filepath: string): void

/**
 * Replaces asynchronously any existing tags with the given tags in the
 * specified file.
 * @public
 */
export function write(
    tags: WriteTags, filepath: string, callback: WriteCallback
): void

export function write(
    tags: WriteTags,
    filebuffer: string | Buffer,
    callback?: WriteCallback
): Buffer | void {
    const id3Tag = create(tags)

    if (isFunction(callback)) {
        writeId3TagToFileAsync(validateString(filebuffer), id3Tag)
        .then(() => callback(null), (error) => callback(error))
        return
    }
    if (isString(filebuffer)) {
        return writeId3TagToFileSync(filebuffer, id3Tag)
    }
    return writeInBuffer(id3Tag, filebuffer)
}

function writeInBuffer(tags: Buffer, buffer: Buffer) {
    buffer = removeTagsFromBuffer(buffer) || buffer
    return Buffer.concat([tags, buffer])
}
