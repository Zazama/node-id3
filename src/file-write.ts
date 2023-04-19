import {
    fsWritePromise,
    fillBufferAsync,
    fillBufferSync,
    processFileSync,
    processFileAsync,
    fsExistsPromise,
    fsWriteFilePromise,
    fsRenamePromise,
    unlinkIfExistSync,
    unlinkIfExist
} from "./util-file"
import * as fs from 'fs'
import { Header, findId3TagPosition, getId3TagSize } from "./id3-tag"
import { WriteCallback, WriteOptions } from "./types/write"
import { hrtime } from "process"

const MinBufferSize = Header.size
const DefaultFileBufferSize = 20 * 1024 * 1024

export function writeId3TagToFileSync(
    filepath: string,
    id3Tag: Buffer,
    options: WriteOptions
): void {
    if (!fs.existsSync(filepath)) {
        fs.writeFileSync(filepath, id3Tag)
        return
    }
    const tempFilepath = makeTempFilepath(filepath)
    processFileSync(filepath, 'r', (readFileDescriptor) => {
        try {
            processFileSync(tempFilepath, 'w', (writeFileDescriptor) => {
                fs.writeSync(writeFileDescriptor, id3Tag)
                copyFileWithoutId3TagSync(
                    readFileDescriptor,
                    writeFileDescriptor,
                    getFileBufferSize(options)
                )
            })
        } catch(error) {
            unlinkIfExistSync(tempFilepath)
            throw error
        }
    })
    fs.renameSync(tempFilepath, filepath)
}

export function writeId3TagToFile(
    filepath: string,
    id3Tag: Buffer,
    options: WriteOptions,
    callback: WriteCallback
): void {
    writeId3TagToFileAsync(filepath, id3Tag, options)
    .then(
        () => callback(null),
        (error) => callback(error)
    )
}

export async function writeId3TagToFileAsync(
    filepath: string,
    id3Tag: Buffer,
    options: WriteOptions
): Promise<void> {
    if (!await fsExistsPromise(filepath)) {
        await fsWriteFilePromise(filepath, id3Tag)
        return
    }
    const tempFilepath = makeTempFilepath(filepath)
    await processFileAsync(filepath, 'r', async (readFileDescriptor) => {
        try {
            await processFileAsync(tempFilepath, 'w',
                async (writeFileDescriptor) => {
                    await fsWritePromise(writeFileDescriptor, id3Tag)
                    await copyFileWithoutId3TagAsync(
                        readFileDescriptor,
                        writeFileDescriptor,
                        getFileBufferSize(options)
                    )
                }
            )
        } catch(error) {
            await unlinkIfExist(tempFilepath)
            throw error
        }

    })
    await fsRenamePromise(tempFilepath, filepath)
}

function getFileBufferSize(options: WriteOptions) {
    return Math.max(
        options.fileBufferSize ?? DefaultFileBufferSize,
        MinBufferSize
    )
}
function makeTempFilepath(filepath: string) {
    // A high-resolution time is required to avoid potential conflicts
    // when running multiple tests in parallel for example.
    // Date.now() resolution is too low.
    return `${filepath}.tmp-${hrtime.bigint()}`
}

function copyFileWithoutId3TagSync(
    readFileDescriptor: number,
    writeFileDescriptor: number,
    fileBufferSize: number
) {
    const buffer = Buffer.alloc(fileBufferSize)
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
    writeFileDescriptor: number,
    fileBufferSize: number
) {
    const buffer = Buffer.alloc(fileBufferSize)
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
