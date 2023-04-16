import { WriteTags } from "../types/Tags"
import { Options } from "../types/Options"
import { isFunction, isString, validateString } from "../util"
import { read } from "./read"
import { updateTags } from '../updateTags'
import { write } from "./write"
import { WriteCallback } from "../types/write"

/**
 * Updates ID3-Tags from the given buffer.
 * Throws in case of error.
 *
 * @public
 */
export function update(
    tags: WriteTags,
    buffer: Buffer,
    options?: Options
): Buffer

/**
 * Updates ID3-Tags synchronously in the specified file.
 * Throws in case of error.
 *
 * @public
 */
export function update(
    tags: WriteTags,
    filepath: string,
    options?: Options
): void

/**
 * Updates ID3-Tags asynchronously in the specified file.
 * throws in case of error.
 *
 * @public
 */
export function update(
    tags: WriteTags,
    filepath: string,
    callback: WriteCallback
): void

/**
 * Updates ID3-Tags asynchronously from the given buffer or specified file.
 * throws in case of error.
 *
 * @public
 */
export function update(
    tags: WriteTags,
    filepath: string,
    options: Options,
    callback: WriteCallback
): void

export function update(
    tags: WriteTags,
    filebuffer: string | Buffer,
    optionsOrCallback?: Options | WriteCallback,
    callback?: WriteCallback
): Buffer | void {
    const options: Options =
        (isFunction(optionsOrCallback) ? {} : optionsOrCallback) ?? {}
    callback =
        isFunction(optionsOrCallback) ? optionsOrCallback : callback

    const currentTags = read(filebuffer, options)
    const updatedTags = updateTags(tags, currentTags)
    if (isFunction(callback)) {
        return write(updatedTags, validateString(filebuffer), callback)
    }
    if (isString(filebuffer)) {
        return write(updatedTags, filebuffer)
    }
    return write(updatedTags, filebuffer)
}
