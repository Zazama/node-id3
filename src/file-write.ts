import {
    fsWritePromise,
    processFileSync,
    processFileAsync,
    fsExistsPromise,
    fsWriteFilePromise,
    fsRenamePromise,
    unlinkIfExistSync,
    unlinkIfExist,
    fsReadAsync,
    makeTempFilepath
} from "./util-file"
import * as fs from 'fs'
import { WriteOptions } from "./types/write"
import { Id3TagRemover } from "./file-stream-processor"

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
                    options.fileBufferSize
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
                        options.fileBufferSize
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

function copyFileWithoutId3TagSync(
    readFileDescriptor: number,
    writeFileDescriptor: number,
    fileBufferSize?: number
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
    fileBufferSize?: number
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
