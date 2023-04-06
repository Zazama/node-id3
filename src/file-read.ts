import * as fs from 'fs'
import { promisify } from 'util'
import { findId3TagPosition, getId3TagSize, Header } from './id3-tag'

const FileBufferSize = 20 * 1024 * 1024

const fsOpenPromise = promisify(fs.open)
const fsReadPromise = promisify(fs.read)
const fsClosePromise = promisify(fs.close)

type SuccessCallback = (err: null, buffer: Buffer|null) => void
type ErrorCallback = (err: Error, buffer: null) => void
type Callback = SuccessCallback & ErrorCallback

export function getId3TagDataFromFileSync(filepath: string): Buffer|null {
    return processFile(filepath, 'r', (fileDescriptor) => {
        const partialId3TagData = findPartialId3TagSync(fileDescriptor)
        return partialId3TagData ? completePartialId3TagData(
            fileDescriptor,
            partialId3TagData
        ) : null
    })
}

export function getId3TagDataFromFileAsync(filepath: string, callback: Callback) {
    processFileAsync(filepath, 'r', async (fileDescriptor) => {
        const partialId3TagData = await findPartialId3TagAsync(fileDescriptor)
        return partialId3TagData ? completePartialId3TagDataAsync(
            fileDescriptor,
            partialId3TagData
        ) : null
    }).then((data) => {
        callback(null, data)
    }).catch((error) => {
        callback(error, null)
    })
}

function findPartialId3TagSync(fileDescriptor: number): Buffer|null {
    const buffer = Buffer.alloc(FileBufferSize)
    let data
    while((data = getNextBufferSubarraySync(fileDescriptor, buffer)).length > Header.size) {
        const id3TagPosition = findId3TagPosition(data)
        if(id3TagPosition !== -1) {
            return data.subarray(id3TagPosition)
        }
        buffer.copyWithin(0, buffer.length - Header.size)
    }
    return null
}

async function findPartialId3TagAsync(fileDescriptor: number): Promise<Buffer|null> {
    const buffer = Buffer.alloc(FileBufferSize)
    let data
    while((data = await getNextBufferSubarrayAsync(fileDescriptor, buffer)).length > Header.size) {
        const id3TagPosition = findId3TagPosition(data)
        if(id3TagPosition !== -1) {
            return data.subarray(id3TagPosition)
        }
        buffer.copyWithin(0, buffer.length - Header.size)
    }
    return null
}

function getNextBufferSubarraySync(fileDescriptor: number, buffer: Buffer): Buffer {
    const bytesRead = fs.readSync(fileDescriptor, buffer, {offset: Header.size})
    return buffer.subarray(0, bytesRead + Header.size)
}

async function getNextBufferSubarrayAsync(fileDescriptor: number, buffer: Buffer): Promise<Buffer> {
    const bytesRead = (await fsReadPromise(fileDescriptor, {buffer, offset: Header.size})).bytesRead
    return buffer.subarray(0, bytesRead + Header.size)
}

function processFile<T>(
    filepath: string,
    flags: string,
    process: (fileDescriptor: number) => T
) {
    const fileDescriptor = fs.openSync(filepath, flags)
    try {
        return process(fileDescriptor)
    }
    catch (error) {
        throw error
    }
    finally {
        fs.closeSync(fileDescriptor)
    }
}

async function processFileAsync<T>(
    filepath: string,
    flags: string,
    process: (fileDescriptor: number) => Promise<T>
): Promise<T> {
    const fileDescriptor = await fsOpenPromise(filepath, flags)
    try {
        return await process(fileDescriptor)
    }
    catch (error) {
        throw error
    }
    finally {
        await fsClosePromise(fileDescriptor)
    }
}

function calculateMissingBytes(id3TagSize: number, id3TagBuffer: Buffer): number {
    return Math.max(0, id3TagSize - id3TagBuffer.length)
}

function completePartialId3TagData(fileDescriptor: number, partialId3TagData: Buffer): Buffer {
    const id3TagSize = getId3TagSize(partialId3TagData)
    const missingBytesCount = calculateMissingBytes(id3TagSize, partialId3TagData)
    if(missingBytesCount) {
        const id3TagRemainingBuffer = Buffer.alloc(missingBytesCount, 0x00)
        fs.readSync(fileDescriptor, id3TagRemainingBuffer)
        return Buffer.concat([
            partialId3TagData,
            id3TagRemainingBuffer
        ])
    }
    return partialId3TagData.subarray(0, id3TagSize)
}

async function completePartialId3TagDataAsync(fileDescriptor: number, partialId3TagData: Buffer): Promise<Buffer> {
    const id3TagSize = getId3TagSize(partialId3TagData)
    const missingBytesCount = calculateMissingBytes(id3TagSize, partialId3TagData)
    if(missingBytesCount) {
        const id3TagRemainingBuffer = Buffer.alloc(missingBytesCount, 0x00)
        await fsReadPromise(fileDescriptor, {buffer: id3TagRemainingBuffer})
        return Buffer.concat([
            partialId3TagData,
            id3TagRemainingBuffer
        ])
    }
    return partialId3TagData.subarray(0, id3TagSize)
}