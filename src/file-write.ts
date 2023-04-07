import {
    fsReadPromise,
    fsRenamePromise,
    fsUnlinkPromise,
    fsWritePromise,
    getNextBufferSubarrayAsync,
    getNextBufferSubarraySync,
    processFile,
    processFileAsync
} from "./util-file"
import * as tmp from 'tmp'
import * as path from 'path'
import * as fs from 'fs'
import { findId3TagPosition, getId3TagSize } from "./id3-tag"

const FileBufferSize = 20 * 1024 * 1024

export function writeId3TagToFileSync(filepath: string, id3Tag: Buffer) {
    const tmpFile = getTmpFilePathSync(filepath)
    processFile(filepath, 'r', (readFileDescriptor) => {
        processFile(tmpFile, 'w', (writeFileDescriptor) => {
            fs.writeSync(writeFileDescriptor, id3Tag)
            streamOriginalIntoNewFileSync(readFileDescriptor, writeFileDescriptor)
        })
    })
    fs.unlinkSync(filepath)
    fs.renameSync(tmpFile, filepath)
}

export function writeId3TagToFileAsync(filepath: string, id3Tag: Buffer, callback: (err: Error|null) => void) {
    getTmpFileAsync(filepath, (err, tmpFile) => {
        if(err || !tmpFile) {
            return callback(err)
        }

        processFileAsync(filepath, 'r', async (readFileDescriptor) => {
            return processFileAsync(tmpFile, 'w', async (writeFileDescriptor) => {
                await fsWritePromise(writeFileDescriptor, id3Tag)
                await streamOriginalIntoNewFileAsync(readFileDescriptor, writeFileDescriptor)
            })
        }).then(async () => {
            await fsUnlinkPromise(filepath)
            await fsRenamePromise(tmpFile, filepath)
        }).catch((error) => {
            callback(error)
        })
    })
}

function getTmpFilePathSync(filepath: string): string {
    const parsedPath = path.parse(filepath)
    return tmp.tmpNameSync({
        tmpdir: parsedPath.dir,
        template: `${parsedPath.base}.tmp-XXXXXX`,
    })
}

function getTmpFileAsync(filepath: string, callback: tmp.TmpNameCallback) {
    const parsedPath = path.parse(filepath)
    tmp.tmpName({
        tmpdir: parsedPath.dir,
        template: `${parsedPath.base}.tmp-XXXXXX`,
    }, (err, filename) => {
        callback(err, filename)
    })
}

function streamOriginalIntoNewFileSync(readFileDescriptor: number, writeFileDescriptor: number) {
    const buffer = Buffer.alloc(FileBufferSize)
    let data
    while((data = getNextBufferSubarraySync(readFileDescriptor, buffer)).length) {
        const id3TagPosition = findId3TagPosition(data)
        if(id3TagPosition !== -1) {
            data = getBufferWithoutId3TagAndSkipSync(readFileDescriptor, data, id3TagPosition)
        }
        fs.writeSync(writeFileDescriptor, data, 0, data.length, null)
    }
}

async function streamOriginalIntoNewFileAsync(readFileDescriptor: number, writeFileDescriptor: number) {
    const buffer = Buffer.alloc(FileBufferSize)
    let data
    while((data = await getNextBufferSubarrayAsync(readFileDescriptor, buffer)).length) {
        const id3TagPosition = findId3TagPosition(data)
        if(id3TagPosition !== -1) {
            data = await getBufferWithoutId3TagAndSkipAsync(readFileDescriptor, data, id3TagPosition)
        }
        await fsWritePromise(writeFileDescriptor, data, 0, data.length, null)
    }
}

function getBufferWithoutId3TagAndSkipSync(fileDescriptor: number, data: Buffer, id3TagPosition: number): Buffer {
    const dataFromId3Start = data.subarray(id3TagPosition)
    const id3TagSize = getId3TagSize(dataFromId3Start)
    if(id3TagSize > dataFromId3Start.length) {
        const missingBytesCount = id3TagSize - dataFromId3Start.length
        fs.readSync(
            fileDescriptor,
            Buffer.alloc(missingBytesCount),
            0,
            missingBytesCount,
            null
        )
        return data.subarray(0, id3TagPosition)
    }

    const id3TagEndPosition = id3TagPosition + id3TagSize
    return Buffer.concat([
        data.subarray(0, id3TagPosition),
        data.subarray(id3TagEndPosition)
    ])
}

async function getBufferWithoutId3TagAndSkipAsync(fileDescriptor: number, data: Buffer, id3TagPosition: number): Promise<Buffer> {
    const dataFromId3Start = data.subarray(id3TagPosition)
    const id3TagSize = getId3TagSize(dataFromId3Start)
    if(id3TagSize > dataFromId3Start.length) {
        const missingBytesCount = id3TagSize - dataFromId3Start.length
        await fsReadPromise(
            fileDescriptor,
            Buffer.alloc(missingBytesCount),
            0,
            missingBytesCount,
            null
        )
        return data.subarray(0, id3TagPosition)
    }

    const id3TagEndPosition = id3TagPosition + id3TagSize
    return Buffer.concat([
        data.subarray(0, id3TagPosition),
        data.subarray(id3TagEndPosition)
    ])
}