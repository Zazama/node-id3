import { getTagsFromId3Tag } from '../id3-tag'
import { isFunction, isString } from '../util'
import { Tags, TagIdentifiers } from '../types/Tags'
import { Options } from '../types/Options'
import {
    getId3TagDataFromFileAsync,
    getId3TagDataFromFileSync
} from '../file-read'
import { ReadCallback } from '../types/read'

/**
 * Reads ID3-Tags synchronously from passed buffer/filepath.
 *
 * @public
 */
export function read(filebuffer: string | Buffer, options?: Options): Tags

/**
 * Reads ID3-Tags asynchronously from passed filepath.
 *
 * @public
 */
export function read(filebuffer: string, callback: ReadCallback): void

/**
 * Reads ID3-Tags asynchronously from passed filepath.
 *
 * @public
 */
export function read(
    filebuffer: string, options: Options, callback: ReadCallback
): void

export function read(
    filebuffer: string | Buffer,
    optionsOrCallback?: Options | ReadCallback,
    callback?: ReadCallback
): Tags | TagIdentifiers | void {
    const options: Options =
        (isFunction(optionsOrCallback) ? {} : optionsOrCallback) ?? {}
    callback =
        isFunction(optionsOrCallback) ? optionsOrCallback : callback

    if (isFunction(callback)) {
        return readAsync(filebuffer, options, callback)
    }
    return readSync(filebuffer, options)
}

function readSync(filebuffer: string | Buffer, options: Options) {
    if (isString(filebuffer)) {
        filebuffer = getId3TagDataFromFileSync(filebuffer)[0] ?? Buffer.alloc(0)
    }
    return getTagsFromId3Tag(filebuffer, options)
}

function readAsync(
    filebuffer: string | Buffer,
    options: Options,
    callback: ReadCallback
) {
    if (isString(filebuffer)) {
        getId3TagDataFromFileAsync(filebuffer).then(
            (data) => callback(
                null, getTagsFromId3Tag(data[0] ?? Buffer.alloc(0), options)
            ),
            (error) => callback(error, null)
        )
    } else {
        callback(null, getTagsFromId3Tag(filebuffer, options))
    }
}
