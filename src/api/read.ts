import { getTagsFromId3Tag } from '../id3-tag'
import { isFunction, isString } from '../util'
import { Tags, TagIdentifiers } from '../types/Tags'
import { Options } from '../types/Options'
import {
    getId3TagDataFromFileAsync,
    getId3TagDataFromFileSync
} from '../file-read'
import { FileReadOptions, ReadCallback } from '../types/read'

/**
 * Reads ID3-Tags from a buffer.
 * @deprecated Use `readFromBuffer` instead.
 * @public
 */
export function read(buffer: Buffer, options?: Options): Tags

/**
 * Reads ID3-Tags synchronously from a file.
 * @deprecated Use `readFromFileSync` instead.
 * @public
 */
export function read(filepath: string, options?: FileReadOptions): Tags

/**
 * Reads ID3-Tags asynchronously from passed filepath.
 * @deprecated Use `readFromFile` instead.
 * @public
 */
export function read(filebuffer: string, callback: ReadCallback): void

/**
 * Reads ID3-Tags asynchronously from passed filepath.
 * @deprecated Use `readFromFile` instead.
 * @public
 */
export function read(
    filebuffer: string, options: FileReadOptions, callback: ReadCallback
): void

export function read(
    filebuffer: string | Buffer,
    optionsOrCallback?: FileReadOptions | ReadCallback,
    callback?: ReadCallback
): Tags | TagIdentifiers | void {
    const options: FileReadOptions =
        (isFunction(optionsOrCallback) ? {} : optionsOrCallback) ?? {}
    callback =
        isFunction(optionsOrCallback) ? optionsOrCallback : callback

    if (isFunction(callback)) {
        return readAsync(filebuffer, options, callback)
    }
    return readSync(filebuffer, options)
}

function readSync(filebuffer: string | Buffer, options: FileReadOptions) {
    if (isString(filebuffer)) {
        filebuffer = getId3TagDataFromFileSync(filebuffer, options)[0] ?? Buffer.alloc(0)
    }
    return getTagsFromId3Tag(filebuffer, options)
}

function readAsync(
    filebuffer: string | Buffer,
    options: FileReadOptions,
    callback: ReadCallback
) {
    if (isString(filebuffer)) {
        getId3TagDataFromFileAsync(filebuffer, options).then(
            (buffers) => callback(
                null, decodeTagBuffers(buffers, options)
            ),
            (error) => callback(error, null)
        )
    } else {
        callback(null, getTagsFromId3Tag(filebuffer, options))
    }
}

// New API

/**
 * Reads ID3-Tags from a buffer.
 *
 * @public
 */
export function readFromBuffer(
    buffer: Buffer,
    options: Options = {}
): Tags | TagIdentifiers {
    return getTagsFromId3Tag(buffer, options)
}

/**
 * Reads ID3-Tags synchronously from a file.
 *
 * @public
 */
export function readFromFileSync(
    filepath: string,
    options: FileReadOptions = {}
): Tags | TagIdentifiers {
    const buffers = getId3TagDataFromFileSync(filepath, options)
    return decodeTagBuffers(buffers, options)
}

/**
 * Reads ID3-Tags asynchronously from a file.
 *
 * @public
 */
export function readFromFile(
    filepath: string,
    callback: ReadCallback
): void

/**
 * Reads ID3-Tags asynchronously from a file.
 *
 * @public
 */
export function readFromFile(
    filepath: string,
    options: FileReadOptions,
    callback: ReadCallback
): void

export function readFromFile(
    filepath: string,
    optionsOrCallback?: FileReadOptions | ReadCallback,
    maybeCallback: ReadCallback = () => { /* */ }
): void {
    const options: FileReadOptions =
        (isFunction(optionsOrCallback) ? {} : optionsOrCallback) ?? {}
    const callback =
        isFunction(optionsOrCallback) ? optionsOrCallback : maybeCallback

    getId3TagDataFromFileAsync(filepath, options).then(
        (buffers) => callback(
            null, decodeTagBuffers(buffers, options)
        ),
        (error) => callback(error, null)
    )
}

// For now, just take the first one
function decodeTagBuffers(buffers: Buffer[], options: Options) {
    const firstBuffer = buffers[0] ?? Buffer.alloc(0)
    return getTagsFromId3Tag(firstBuffer, options)
}
