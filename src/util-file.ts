import * as fs from 'fs'
import { promisify } from 'util'

export const fsOpenPromise = promisify(fs.open)
export const fsReadPromise = promisify(fs.read)
export const fsClosePromise = promisify(fs.close)
export const fsWritePromise = promisify(fs.write)
export const fsUnlinkPromise = promisify(fs.unlink)
export const fsRenamePromise = promisify(fs.rename)
export const fsExistsPromise = promisify(fs.exists)
export const fsWriteFilePromise = promisify(fs.writeFile)

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

export function fillBufferSync(
    fileDescriptor: number,
    buffer: Buffer,
    offset = 0
): Buffer {
    const bytesRead = fs.readSync(
        fileDescriptor,
        buffer,
        offset,
        buffer.length - offset,
        null
    )
    return buffer.subarray(0, bytesRead + offset)
}

export async function fillBufferAsync(
    fileDescriptor: number,
    buffer: Buffer,
    offset = 0
): Promise<Buffer> {
    const bytesRead = (await fsReadPromise(
        fileDescriptor,
        buffer,
        offset,
        buffer.length - offset,
        null
    )).bytesRead
    return buffer.subarray(0, bytesRead + offset)
}
