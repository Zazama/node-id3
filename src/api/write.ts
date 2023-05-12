import * as fs from "fs"
import { WriteTags } from "../types/Tags"
import { create }  from "./create"
import { removeTagsFromBuffer } from "./remove"
import { isFunction, isString } from "../util"
import { writeId3TagToFileAsync, writeId3TagToFileSync } from "../file-write"

/**
 * Callback signature for successful asynchronous update and write operations.
 *
 * @public
 */
export type WriteSuccessCallback =
    (error: null, data: Buffer) => void

/**
 * Callback signature for failing asynchronous update and write operations.
 *
 * @public
 */
export type WriteErrorCallback =
    (error: NodeJS.ErrnoException | Error, data: null) => void

/**
 * Callback signatures for asynchronous update and write operations.
 *
 * @public
 */
export type WriteCallback =
    WriteSuccessCallback & WriteErrorCallback

export type WriteFileCallback =
    (error: NodeJS.ErrnoException | Error | null) => void

/**
 * Replaces any existing tags with the given tags in the given buffer.
 *
 * @public
 */
export function write(tags: WriteTags, buffer: Buffer): Buffer

/**
 * Replaces synchronously any existing tags with the given tags in the
 * specified file.
 *
 * @public
 */
export function write(tags: WriteTags, filepath: string): true | Error

/**
 * Replaces asynchronously any existing tags with the given tags in the
 * given buffer.
 *
 * @public
 */
export function write(
    tags: WriteTags, filebuffer: Buffer, callback: WriteCallback
): void

/**
 * Replaces asynchronously any existing tags with the given tags in the
 * given file.
 *
 * @public
 */
export function write(
    tags: WriteTags, filebuffer: string, callback: WriteFileCallback
): void

/**
 * Replaces asynchronously any existing tags with the given tags in the
 * given buffer or specified file.
 *
 * @public
 */
export function write(
    tags: WriteTags, filebuffer: string | Buffer, callback: WriteFileCallback | WriteCallback
): void

export function write(
    tags: WriteTags,
    filebuffer: string | Buffer,
    callback?: WriteCallback | WriteFileCallback
): Buffer | true | Error | void {
    const tagsBuffer = create(tags)

    if (isFunction(callback)) {
        if (isString(filebuffer)) {
            return writeAsync(tagsBuffer, filebuffer, callback as WriteFileCallback)
        }
        return callback(null, writeInBuffer(tagsBuffer, filebuffer))
    }
    if (isString(filebuffer)) {
        return writeSync(tagsBuffer, filebuffer)
    }
    return writeInBuffer(tagsBuffer, filebuffer)
}

function writeInBuffer(tags: Buffer, buffer: Buffer) {
    buffer = removeTagsFromBuffer(buffer) || buffer
    return Buffer.concat([tags, buffer])
}

function writeAsync(tags: Buffer, filepath: string, callback: WriteFileCallback) {
    writeId3TagToFileAsync(filepath, tags, (err) => {
        callback(err)
    })
}

function writeSync(tags: Buffer, filepath: string) {
    try {
        writeId3TagToFileSync(filepath, tags)
        return true
    } catch(error) {
        return error as Error
    }
}
