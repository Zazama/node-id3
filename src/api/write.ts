import * as fs from "fs"
import { WriteTags } from "../types/Tags"
import { create }  from "./create"
import { removeTagsFromBuffer } from "./remove"
import { isFunction, isString } from "../util"

export type WriteCallback = {
    (error: null, data: Buffer): void
    (error: NodeJS.ErrnoException | Error, data: null): void
}

/**
 * Write passed tags to a file/buffer
 */
export function write(tags: WriteTags, buffer: Buffer): Buffer
export function write(tags: WriteTags, filepath: string): true | Error
export function write(
    tags: WriteTags, filebuffer: string | Buffer, callback: WriteCallback
): void
export function write(
    tags: WriteTags,
    filebuffer: string | Buffer,
    callback?: WriteCallback
): Buffer | true | Error | void {
    const tagsBuffer = create(tags)

    if (isFunction(callback)) {
        if (isString(filebuffer)) {
            return writeAsync(tagsBuffer, filebuffer, callback)
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

function writeAsync(tags: Buffer, filepath: string, callback: WriteCallback) {
    fs.readFile(filepath, (error, data) => {
        if (error) {
            callback(error, null)
            return
        }
        const newData = writeInBuffer(tags, data)
        fs.writeFile(filepath, newData, 'binary', (error) => {
            if (error) {
                callback(error, null)
            } else {
                callback(null, newData)
            }
        })
    })
}

function writeSync(tags: Buffer, filepath: string) {
    try {
        const data = fs.readFileSync(filepath)
        const newData = writeInBuffer(tags, data)
        fs.writeFileSync(filepath, newData, 'binary')
        return true
    } catch(error) {
        return error as Error
    }
}
