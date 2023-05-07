import { getId3Tag, Header } from './id3-tag'

// const FileBufferSize = 20 * 1024 * 1024

// Must be at least Header.size which is the min size to detect an ID3 header.
// Naming it help identifying the code handling it.
const RolloverBufferSize = Header.size

export class Id3TagStreamProcessor {
    private buffer: Buffer
    private tags: Buffer[] = []
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
        let missingData = Buffer.alloc(0)
        let tag
        while((tag = getId3Tag(data))) {
            const tagBuffer = Buffer.alloc(tag.size)
            tag.data.copy(tagBuffer)
            data = tag.after
            missingData = tagBuffer.subarray(tag.data.length)
        }

        // Exclude rollover window on the last part
        this.rolloverSize = Math.min(RolloverBufferSize, data.length, readSize)
        const rolloverStart = data.length - this.rolloverSize
        const rolloverData = Buffer.from(data.subarray(rolloverStart))

        // Update rollover window
        rolloverData.copy(this.buffer)

        this.continue = this.rolloverSize !==0 || missingData.length !== 0

        return missingData
    }

    getTags() {
        return this.tags
    }
}
