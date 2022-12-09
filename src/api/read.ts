import * as fs from 'fs'
import { getTagsFromBuffer } from '../TagsHelpers'
import { isFunction, isString } from '../util'
import { Tags, TagIdentifiers } from '../types/Tags'
import { Options } from '../types/Options'

/**
 * Callback signature for successful asynchronous read operation.
 *
 * @param tags - `TagsIdentifiers` if the `rawOnly` option was true otherwise
 *               `Tags`
 * @public
 */
export type ReadSuccessCallback =
    (error: null, tags: Tags | TagIdentifiers) => void

/**
 * Callback signatures for failing asynchronous read operation.
 *
 * @public
 */
export type ReadErrorCallback =
    (error: NodeJS.ErrnoException | Error, tags: null) => void

/**
 * Callback signatures for asynchronous read operation.
 *
 * @public
 */
export type ReadCallback =
    ReadSuccessCallback & ReadErrorCallback

/**
 * Reads ID3-Tags synchronously from passed buffer/filepath.
 *
 * @public
 */
export function read(filebuffer: string | Buffer, options?: Options): Tags

/**
 * Reads ID3-Tags asynchronously from passed buffer/filepath.
 *
 * @public
 */
export function read(filebuffer: string | Buffer, callback: ReadCallback): void

/**
 * Reads ID3-Tags asynchronously from passed buffer/filepath.
 *
 * @public
 */
export function read(
    filebuffer: string | Buffer, options: Options, callback: ReadCallback
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
        filebuffer = fs.readFileSync(filebuffer)
    }
    return getTagsFromBuffer(filebuffer, options)
}

function readAsync(
    filebuffer: string | Buffer,
    options: Options,
    callback: ReadCallback
) {
    if (isString(filebuffer)) {
        fs.readFile(filebuffer, (error, data) => {
            if(error) {
                callback(error, null)
            } else {
                callback(null, getTagsFromBuffer(data, options))
            }
        })
    } else {
        callback(null, getTagsFromBuffer(filebuffer, options))
    }
}
