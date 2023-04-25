import {
    fsWritePromise,
    processFileSync,
    processFileAsync,
    fsExistsPromise,
    fsWriteFilePromise,
    fsRenamePromise,
    unlinkIfExistSync,
    unlinkIfExist,
    fsReadAsync
} from "./util-file"
import * as fs from 'fs'
import { Header, getId3Tag } from "./id3-tag"
import { WriteOptions } from "./types/write"
import { hrtime } from "process"

// Must be at least Header.size which is the min size to detect an ID3 header.
// Naming it help identifying the code handling it.
const RolloverBufferSize = Header.size

const MinBufferSize = RolloverBufferSize + 1
const DefaultFileBufferSize = RolloverBufferSize + 20 * 1024 * 1024

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

class Id3TagRemover {
    private buffer: Buffer
    private rolloverSize = 0
    continue = false

    constructor(bufferSize: number) {
        // TODO enforce min buffer size here,
        // i.e. bufferSize + RolloverBufferSize + 1
        this.buffer = Buffer.alloc(bufferSize)
    }

    getReadBuffer() {
        return this.buffer.subarray(this.rolloverSize)
    }

    processReadBuffer(readSize: number) {
        let data = this.buffer.subarray(0, this.rolloverSize + readSize)

        // TODO extract that to id3-tag
        // Remove tags from `data`
        let missingBytes = 0
        const parts = Array.from((function*() {
            let tag
            while((tag = getId3Tag(data))) {
                yield tag.before
                data = tag.after
                missingBytes = tag.missingBytes
            }
        })())

        // Exclude rollover window on the last part
        this.rolloverSize = Math.min(RolloverBufferSize, data.length, readSize)
        const rolloverStart = data.length - this.rolloverSize
        const rolloverData = Buffer.from(data.subarray(rolloverStart))
        parts.push(data.subarray(0, rolloverStart))

        const writeBuffer = Buffer.concat(parts)

        // Update rollover window
        rolloverData.copy(this.buffer)

        this.continue = this.rolloverSize !==0 || missingBytes !== 0

        return {
            skipBuffer: Buffer.alloc(missingBytes),
            writeBuffer
        }
    }
}

function copyFileWithoutId3TagSync(
    readFileDescriptor: number,
    writeFileDescriptor: number,
    fileBufferSize: number
) {
    const remover = new Id3TagRemover(fileBufferSize)
    do {
        const readBuffer = remover.getReadBuffer()
        const sizeRead = fs.readSync(readFileDescriptor, readBuffer)
        const { skipBuffer, writeBuffer } = remover.processReadBuffer(sizeRead)
        fs.readSync(readFileDescriptor, skipBuffer)
        fs.writeSync(writeFileDescriptor, writeBuffer)
    } while(remover.continue)
}

async function copyFileWithoutId3TagAsync(
    readFileDescriptor: number,
    writeFileDescriptor: number,
    fileBufferSize: number
) {
    const remover = new Id3TagRemover(fileBufferSize)
    do {
        const readBuffer = remover.getReadBuffer()
        const sizeRead = await fsReadAsync(readFileDescriptor, readBuffer)
        const { skipBuffer, writeBuffer } = remover.processReadBuffer(sizeRead)
        await fsReadAsync(readFileDescriptor, skipBuffer)
        await fsWriteFilePromise(writeFileDescriptor, writeBuffer)
    } while(remover.continue)
}
