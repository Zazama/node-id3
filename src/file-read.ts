import * as fs from 'fs'
import { findId3TagPosition, getId3TagSize, Header } from './id3-tag'
import { fsReadPromise, getNextBufferSubarrayAsync, getNextBufferSubarraySync, processFile, processFileAsync } from './util-file'

const FileBufferSize = 20 * 1024 * 1024

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
    while((data = getNextBufferSubarraySync(fileDescriptor, buffer, Header.size)).length > Header.size) {
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
    while((data = await getNextBufferSubarrayAsync(fileDescriptor, buffer, Header.size)).length > Header.size) {
        const id3TagPosition = findId3TagPosition(data)
        if(id3TagPosition !== -1) {
            return data.subarray(id3TagPosition)
        }
        buffer.copyWithin(0, buffer.length - Header.size)
    }
    return null
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