import { WriteTags } from "../types/Tags"
import { WriteCallback, WriteOptions } from "../types/write"
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
export function write(
    tags: WriteTags,
    filepath: string,
    options?: WriteOptions
): void

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
    optionsOrCallback?: WriteOptions | WriteCallback,
    maybeCallback?: WriteCallback
): Buffer | void {
    const options =
        (isFunction(optionsOrCallback) ? {} : optionsOrCallback) ?? {}
    const callback =
        isFunction(optionsOrCallback) ? optionsOrCallback : maybeCallback

    if (isFunction(callback)) {
        writeInFile(tags, validateString(filebuffer), options, callback)
        return
    }
    if (isString(filebuffer)) {
        return writeInFileSync(tags, filebuffer, options)
    }
    return writeInBuffer(tags, filebuffer)
}

// New API

/**
 * Replaces any existing tags with the given tags in the given buffer.
 * Throws in case of error.
 * @public
 */
export function writeInBuffer(tags: WriteTags, buffer: Buffer): Buffer {
    const id3Tag = create(tags)
    const bufferWithoutId3Tag = removeTagsFromBuffer(buffer) || buffer
    return Buffer.concat([id3Tag, bufferWithoutId3Tag])
}

/**
 * Replaces synchronously any existing tags with the given tags in the
 * specified file.
 * Throws in case of error.
 * @public
 */
export function writeInFileSync(
    tags: WriteTags,
    filepath: string,
    options: WriteOptions = {}
): void {
    const id3Tag = create(tags)
    writeId3TagToFileSync(filepath, id3Tag, options)
}

/**
 * Replaces asynchronously any existing tags with the given tags in the
 * specified file.
 * @public
 */
export function writeInFile(
    tags: WriteTags,
    filepath: string,
    callback: WriteCallback
): void

/**
 * Replaces asynchronously any existing tags with the given tags in the
 * specified file.
 * @public
 */
export function writeInFile(
    tags: WriteTags,
    filepath: string,
    options: WriteOptions,
    callback: WriteCallback
): void

/**
 * Replaces asynchronously any existing tags with the given tags in the
 * specified file.
 * @public
 */
export function writeInFile(
    tags: WriteTags,
    filepath: string,
    optionsOrCallback: WriteOptions | WriteCallback,
    maybeCallback: WriteCallback = () => { /* */ }
): void {
    const options =
        (isFunction(optionsOrCallback) ? {} : optionsOrCallback) ?? {}
    const callback =
        isFunction(optionsOrCallback) ? optionsOrCallback : maybeCallback

    const id3Tag = create(tags)
    writeId3TagToFileAsync(filepath, id3Tag, options).then(
        () => callback(null),
        (error) => callback(error)
    )
}
