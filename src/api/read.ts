import * as fs from 'fs'
import { getTagsFromBuffer } from '../TagsHelpers'
import { isFunction, isString } from '../util'
import { Tags, TagIdentifiers } from '../types/Tags'
import { Options } from '../types/Options'

export type ReadCallback = {
    (error: NodeJS.ErrnoException | Error, tags: null): void
    (error: null, tags: Tags | TagIdentifiers): void
}

/**
 * Read ID3-Tags from passed buffer/filepath
 */
export function read(filebuffer: string | Buffer, options?: Options): Tags
export function read(filebuffer: string | Buffer, callback: ReadCallback): void
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
