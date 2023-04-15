import {
    fsWritePromise,
    fillBufferAsync,
    fillBufferSync,
    processFileSync,
    processFileAsync
} from "./util-file"
import * as tmp from 'tmp'
import * as path from 'path'
import * as fs from 'fs'
import { findId3TagPosition, getId3TagSize } from "./id3-tag"

const FileBufferSize = 20 * 1024 * 1024

export function writeId3TagToFileSync(filepath: string, id3Tag: Buffer) {
    const tmpFilepath = tmp.tmpNameSync(getTmpFileOptions(filepath))
    processFileSync(filepath, 'r', (readFileDescriptor) => {
        try {
            processFileSync(tmpFilepath, 'w', (writeFileDescriptor) => {
                fs.writeSync(writeFileDescriptor, id3Tag)
                copyFileWithoutId3TagSync(readFileDescriptor, writeFileDescriptor)
            })
        } catch(error) {
            fs.unlinkSync(tmpFilepath)
            throw error
        }
    })
    fs.renameSync(tmpFilepath, filepath)
}

export function writeId3TagToFileAsync(
    filepath: string,
    id3Tag: Buffer,
    callback: (err: Error|null) => void
) {
    tmp.tmpName(getTmpFileOptions(filepath), (error, tmpFilepath) => {
        if (error) {
            return callback(error)
        }
        processFileAsync(filepath, 'r', async (readFileDescriptor) => {
            processFileAsync(tmpFilepath, 'w', async (writeFileDescriptor) => {
                await fsWritePromise(writeFileDescriptor, id3Tag)
                await copyFileWithoutId3TagAsync(readFileDescriptor, writeFileDescriptor)
            }).catch((error) => {
                fs.unlink(tmpFilepath, callback)
                throw error
            })
        }).then(() => {
            fs.rename(tmpFilepath, filepath, callback)
        }).catch(callback)
    })
}

function getTmpFileOptions(filepath: string): tmp.TmpNameOptions {
    const parsedPath = path.parse(filepath)
    return {
        tmpdir: parsedPath.dir,
        template: `${parsedPath.base}.tmp-XXXXXX`,
    }
}

function copyFileWithoutId3TagSync(
    readFileDescriptor: number,
    writeFileDescriptor: number
) {
    const buffer = Buffer.alloc(FileBufferSize)
    let readData
    while((readData = fillBufferSync(readFileDescriptor, buffer)).length) {
        const { data, bytesToSkip } = removeId3TagIfFound(readData)
        if (bytesToSkip) {
            fillBufferSync(readFileDescriptor, Buffer.alloc(bytesToSkip))
        }
        fs.writeSync(writeFileDescriptor, data, 0, data.length, null)
    }
}

async function copyFileWithoutId3TagAsync(
    readFileDescriptor: number,
    writeFileDescriptor: number
) {
    const buffer = Buffer.alloc(FileBufferSize)
    let readData
    while((readData = await fillBufferAsync(readFileDescriptor, buffer)).length) {
        const { data, bytesToSkip } = removeId3TagIfFound(readData)
        if (bytesToSkip) {
            await fillBufferAsync(readFileDescriptor, Buffer.alloc(bytesToSkip))
        }
        await fsWritePromise(writeFileDescriptor, data, 0, data.length, null)
    }
}

function removeId3TagIfFound(data: Buffer) {
    const id3TagPosition = findId3TagPosition(data)
    if (id3TagPosition === -1) {
        return { data }
    }
    const dataFromId3Start = data.subarray(id3TagPosition)
    const id3TagSize = getId3TagSize(dataFromId3Start)
    return {
        data: Buffer.concat([
            data.subarray(0, id3TagPosition),
            dataFromId3Start.subarray(Math.min(id3TagSize, dataFromId3Start.length))
        ]),
        bytesToSkip: Math.max(0, id3TagSize - dataFromId3Start.length)
    }
}
