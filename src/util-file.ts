import * as fs from 'fs'
import { promisify } from 'util'
import { hrtime } from "process"

export const fsOpenPromise = promisify(fs.open)
export const fsReadPromise = promisify(fs.read)
export const fsClosePromise = promisify(fs.close)
export const fsWritePromise = promisify(fs.write)
export const fsUnlinkPromise = promisify(fs.unlink)
export const fsRenamePromise = promisify(fs.rename)
export const fsExistsPromise = promisify(fs.exists)
export const fsWriteFilePromise = promisify(fs.writeFile)

export async function fsReadAsync(
    fileDescriptor: number,
    buffer: Buffer,
    offset = 0
): Promise<number> {
    return (await fsReadPromise(
        fileDescriptor,
        buffer,
        offset,
        buffer.length,
        null
    )).bytesRead
}

/**
 * @returns true if the file existed
 */
export function unlinkIfExistSync(filepath: string) {
    const exist = fs.existsSync(filepath)
    if (exist) {
        fs.unlinkSync(filepath)
    }
    return exist
}

/**
 * @returns true if the file existed
 */
export async function unlinkIfExist(filepath: string) {
    const exist = await fsExistsPromise(filepath)
    if (exist) {
        await fsUnlinkPromise(filepath)
    }
    return exist
}

export function processFileSync<T>(
    filepath: string,
    flags: string,
    process: (fileDescriptor: number) => T
) {
    const fileDescriptor = fs.openSync(filepath, flags)
    try {
        return process(fileDescriptor)
    }
    finally {
        fs.closeSync(fileDescriptor)
    }
}

export async function processFileAsync<T>(
    filepath: string,
    flags: string,
    process: (fileDescriptor: number) => Promise<T>
): Promise<T> {
    const fileDescriptor = await fsOpenPromise(filepath, flags)
    try {
        return await process(fileDescriptor)
    }
    finally {
        await fsClosePromise(fileDescriptor)
    }
}

export function makeTempFilepath(filepath: string) {
    // A high-resolution time is required to avoid potential conflicts
    // when running multiple tests in parallel for example.
    // Date.now() resolution is too low.
    return `${filepath}.tmp-${hrtime.bigint()}`
}
