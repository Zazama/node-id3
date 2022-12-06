import * as fs from 'fs'
import * as ID3Util from './src/ID3Util'
import * as ID3Helpers from './src/ID3Helpers'
import { isFunction, isString } from './src/util'
import { Tags, WriteTags } from './src/types/Tags'
import { Options } from './src/types/Options'
import { updateTags } from './src/update'

export { Tags, WriteTags } from "./src/types/Tags"
export { Options } from "./src/types/Options"
export { TagConstants } from './src/definitions/TagConstants'

// Used specification: http://id3.org/id3v2.3.0

export type WriteCallback = {
    (error: null, data: Buffer): void
    (error: NodeJS.ErrnoException | Error, data: null): void
}

export type ReadCallback = {
    (error: NodeJS.ErrnoException | Error, tags: null): void
    (error: null, tags: Tags): void
}

export type RemoveCallback =
    (error: NodeJS.ErrnoException | Error | null) => void

export type CreateCallback =
    (data: Buffer) => void

/**
 * Remove already written ID3-Frames from a buffer
 */
export function removeTagsFromBuffer(data: Buffer) {
    const framePosition = ID3Util.getFramePosition(data)

    if (framePosition === -1) {
        return data
    }

    const encodedSize = data.subarray(framePosition + 6, framePosition + 10)
    if (!ID3Util.isValidEncodedSize(encodedSize)) {
        return false
    }

    if (data.length >= framePosition + 10) {
        const size = ID3Util.decodeSize(encodedSize)
        return Buffer.concat([
            data.subarray(0, framePosition),
            data.subarray(framePosition + size + 10)
        ])
    }

    return data
}

function writeInBuffer(tags: Buffer, buffer: Buffer) {
    buffer = removeTagsFromBuffer(buffer) || buffer
    return Buffer.concat([tags, buffer])
}

function writeAsync(tags: Buffer, filepath: string, callback: WriteCallback) {
    fs.readFile(filepath, (error, data) => {
        if(error) {
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

    if(isFunction(callback)) {
        if (isString(filebuffer)) {
            return writeAsync(tagsBuffer, filebuffer, callback)
        }
        return callback(null, writeInBuffer(tagsBuffer, filebuffer))
    }
    if(isString(filebuffer)) {
        return writeSync(tagsBuffer, filebuffer)
    }
    return writeInBuffer(tagsBuffer, filebuffer)
}

/**
 * Creates a buffer containing the ID3 Tag
 */
export function create(tags: WriteTags): Buffer
export function create(tags: WriteTags, callback: CreateCallback): void
export function create(tags: WriteTags, callback?: CreateCallback) {
    const frames = ID3Helpers.createBufferFromTags(tags)

    //  Create ID3 header
    const header = Buffer.alloc(10)
    header.fill(0)
    header.write("ID3", 0)              //File identifier
    header.writeUInt16BE(0x0300, 3)     //Version 2.3.0  --  03 00
    header.writeUInt16BE(0x0000, 5)     //Flags 00
    ID3Util.encodeSize(frames.length).copy(header, 6)

    const id3Data = Buffer.concat([header, frames])

    if(isFunction(callback)) {
        return callback(id3Data)
    }
    return id3Data
}

function readSync(filebuffer: string | Buffer, options: Options): Tags {
    if(isString(filebuffer)) {
        filebuffer = fs.readFileSync(filebuffer)
    }
    return ID3Helpers.getTagsFromBuffer(filebuffer, options)
}

function readAsync(
    filebuffer: string | Buffer,
    options: Options,
    callback: ReadCallback
) {
    if(isString(filebuffer)) {
        fs.readFile(filebuffer, (error, data) => {
            if(error) {
                callback(error, null)
            } else {
                callback(null, ID3Helpers.getTagsFromBuffer(data, options))
            }
        })
    } else {
        callback(null, ID3Helpers.getTagsFromBuffer(filebuffer, options))
    }
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
): Tags | void {
    const options: Options =
        (isFunction(optionsOrCallback) ? {} : optionsOrCallback) ?? {}
    callback =
        isFunction(optionsOrCallback) ? optionsOrCallback : callback

    if(isFunction(callback)) {
        return readAsync(filebuffer, options, callback)
    }
    return readSync(filebuffer, options)
}

/**
 * Update ID3-Tags from passed buffer/filepath
 */
export function update(
    tags: WriteTags,
    buffer: Buffer,
    options?: Options
): Buffer
export function update(
    tags: WriteTags,
    filepath: string,
    options?: Options
): true | Error
export function update(
    tags: WriteTags,
    filebuffer: string | Buffer,
    callback: WriteCallback
): void
export function update(
    tags: WriteTags,
    filebuffer: string | Buffer,
    options: Options,
    callback: WriteCallback
): void
export function update(
    tags: WriteTags,
    filebuffer: string | Buffer,
    optionsOrCallback?: Options | WriteCallback,
    callback?: WriteCallback
): Buffer | true | Error | void {
    const options: Options =
        (isFunction(optionsOrCallback) ? {} : optionsOrCallback) ?? {}
    callback =
        isFunction(optionsOrCallback) ? optionsOrCallback : callback

    const currentTags = read(filebuffer, options)
    const updatedTags = updateTags(tags, currentTags)
    if (isFunction(callback)) {
        return write(updatedTags, filebuffer, callback)
    }
    if (isString(filebuffer)) {
        return write(updatedTags, filebuffer)
    }
    return write(updatedTags, filebuffer)
}

function removeTagsSync(filepath: string) {
    let data
    try {
        data = fs.readFileSync(filepath)
    } catch(error) {
        return error as Error
    }

    const newData = removeTagsFromBuffer(data)
    if(!newData) {
        return false
    }

    try {
        fs.writeFileSync(filepath, newData, 'binary')
    } catch(error) {
        return error as Error
    }

    return true
}

function removeTagsAsync(filepath: string, callback: RemoveCallback) {
    fs.readFile(filepath, (error, data) => {
        if(error) {
            callback(error)
            return
        }

        const newData = removeTagsFromBuffer(data)
        if(!newData) {
            callback(error)
            return
        }

        fs.writeFile(filepath, newData, 'binary', (error) => {
            if(error) {
                callback(error)
            } else {
                callback(null)
            }
        })
    })
}

/**
 * Remove already written ID3-Frames from a file
 */
export function removeTags(filepath: string): boolean | Error
export function removeTags(filepath: string, callback: RemoveCallback): void
export function removeTags(filepath: string, callback?: RemoveCallback) {
    if(isFunction(callback)) {
        return removeTagsAsync(filepath, callback)
    }
    return removeTagsSync(filepath)
}

type Settle<T> = {
    (error: NodeJS.ErrnoException | Error, result: null): void
    (error: null, result: T): void
}

function makePromise<T>(callback: (settle: Settle<T>) => void) {
    return new Promise<T>((resolve, reject) => {
        callback((error, result) => {
            if(error) {
                reject(error)
            } else {
                // result can't be null here according the Settle callable
                // type but TS can't evaluate it properly here, so use the
                // null assertion, and then disable the lint error.
                // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
                resolve(result!)
            }
        })
    })
}

export const Promises = {
    create: (tags: Tags) =>
        makePromise((settle: Settle<Buffer>) =>
            create(tags, result => settle(null, result)),
    ),
    write: (tags: Tags, filebuffer: string | Buffer) =>
        makePromise<Buffer>((callback: WriteCallback) =>
            write(tags, filebuffer, callback)
        ),
    update: (tags: Tags, filebuffer: string | Buffer, options?: Options) =>
        makePromise<Buffer>((callback: WriteCallback) =>
            update(tags, filebuffer, options ?? {}, callback)
        ),
    read: (file: string, options?: Options) =>
        makePromise((callback: ReadCallback) =>
            read(file, options ?? {}, callback)
        ),
    removeTags: (filepath: string) =>
        makePromise((settle: Settle<void>) =>
            removeTags(
                filepath,
                (error) => error ? settle(error, null) : settle(null)
            )
        )
} as const

/**
 * @deprecated consider using `Promises` instead, `Promise` creates conflict
 *             with the Javascript native promise.
 */
export { Promises as Promise }
