import * as fs from 'fs'
import { Id3TagStreamProcessor } from './file-stream-processor'
import { processFileSync, processFileAsync, fsReadAsync } from './util-file'
import { FileOptions } from './types/FileOptions'

export function getId3TagDataFromFileSync(
    filepath: string,
    options: FileOptions
) {
    const reader = new Id3TagStreamProcessor(options.fileBufferSize)
    processFileSync(filepath, 'r', (fileDescriptor) => {
        do {
            const readBuffer = reader.getReadBuffer()
            const sizeRead = fs.readSync(fileDescriptor, readBuffer)
            const missingData = reader.processReadBuffer(sizeRead)
            fs.readSync(fileDescriptor, missingData)
        } while(reader.continue)
    })
    return reader.getTags()
}

export async function getId3TagDataFromFileAsync(
    filepath: string,
    options: FileOptions
) {
    const reader = new Id3TagStreamProcessor(options.fileBufferSize)
    await processFileAsync(filepath, 'r', async (fileDescriptor) => {
        do {
            const readBuffer = reader.getReadBuffer()
            const sizeRead = await fsReadAsync(fileDescriptor, readBuffer)
            const missingData = reader.processReadBuffer(sizeRead)
            await fsReadAsync(fileDescriptor, missingData)
        } while(reader.continue)
    })
    return reader.getTags()
}
