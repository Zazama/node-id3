import * as fs from 'fs'
import { promisify } from 'util'
import { findId3TagPosition, getId3TagSize } from './id3-tag'

const FileBufferSize = 20 * 1024 * 1024
const Id3TagHeaderSize = 10

const fsOpenPromise = promisify(fs.open)
const fsReadPromise = promisify(fs.read)
const fsClosePromise = promisify(fs.close)

type SuccessCallback = (err: null, buffer: Buffer) => void
type ErrorCallback = (err: Error, buffer: Buffer) => void
type Callback = SuccessCallback & ErrorCallback

export function getId3TagDataFromFileSync(filepath: string): Buffer {
    const fileDescriptor = fs.openSync(filepath, 'r')
    const buffer = Buffer.alloc(FileBufferSize)

    while(fs.readSync(fileDescriptor, buffer, {offset: Id3TagHeaderSize})) {
        const id3TagPosition = findId3TagPosition(buffer)
        if(id3TagPosition === -1) {
            buffer.copyWithin(0, buffer.length - 10)
            continue
        }
        fs.closeSync(fileDescriptor)
        return completePartialId3TagData(
            fileDescriptor,
            buffer.subarray(id3TagPosition)
        )
    }

    fs.closeSync(fileDescriptor)
    return Buffer.alloc(0)
}

export function getId3TagDataFromFileAsync(filepath: string, callback: Callback) {
    fsOpenPromise(filepath, 'r').then(async (fileDescriptor) => {
        const buffer = Buffer.alloc(FileBufferSize)
        while((await fsReadPromise(fileDescriptor, {buffer, offset: Id3TagHeaderSize})).bytesRead) {
            const id3TagPosition = findId3TagPosition(buffer)
            if(id3TagPosition === -1) {
                buffer.copyWithin(0, buffer.length - 10)
                continue
            }
            await fsClosePromise(fileDescriptor)
            callback(null, await completePartialId3TagDataAsync(
                fileDescriptor,
                buffer.subarray(id3TagPosition)
            ))
        }

        await fsClosePromise(fileDescriptor)
        callback(null, Buffer.alloc(0))
    }).catch((error: Error) => {
        callback(error, Buffer.alloc(0))
    })
}

function calculateMissingBytes(id3TagSize: number, id3TagBuffer: Buffer) {
    return Math.max(0, id3TagSize - id3TagBuffer.length)
}

function completePartialId3TagData(fileDescriptor: number, partialId3TagData: Buffer): Buffer {
    const id3TagSize = getId3TagSize(partialId3TagData);
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
    const id3TagSize = getId3TagSize(partialId3TagData);
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