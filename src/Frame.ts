import zlib = require('zlib')
import {
    Flags,
    getHeaderSize,
    FrameHeader
} from './FrameHeader'
import * as ID3Frames from './ID3Frames'
import * as ID3Util from './ID3Util'

type FrameKeys = keyof typeof ID3Frames.Frames

export class Frame {
    private identifier: string
    private value: unknown
    flags: Flags

    constructor(identifier: string, value: unknown, flags: Flags = {}) {
        this.identifier = identifier
        this.value = value
        this.flags = flags
    }

    static createFromBuffer(
        frameBuffer: Buffer,
        version: number
    ): Frame | null {
        const frameHeaderSize = getHeaderSize(version)
        // Specification requirement
        if (frameBuffer.length < frameHeaderSize + 1) {
            return null
        }
        const frameHeaderBuffer = frameBuffer.subarray(0, frameHeaderSize)
        const frameHeader = FrameHeader.createFromBuffer(
            frameHeaderBuffer, version
        )
        if (frameHeader.flags.encryption) {
            return null
        }

        const frameBodyOffset = frameHeader.flags.dataLengthIndicator ? 4 : 0
        const frameBodyStart = frameHeaderSize + frameBodyOffset
        let frameBody = frameBuffer.subarray(frameBodyStart, frameBodyStart + frameHeader.bodySize - frameBodyOffset)
        if (frameHeader.flags.unsynchronisation) {
            // This method should stay in ID3Util for now because it's also used in the Tag's header which we don't have a class for.
            frameBody = ID3Util.processUnsynchronisedBuffer(frameBody)
        }

        const decompressedFrameBody = decompressBody(
            frameHeader.flags, frameBuffer, frameHeaderSize, frameBody
        )
        if (!decompressedFrameBody) {
            return null
        }
        frameBody = decompressedFrameBody

        const identifier = frameHeader.identifier
        const Frames = ID3Frames.Frames
        let value = null
        if (identifier in Frames) {
            value = Frames[identifier as FrameKeys].read(frameBody, version)
        } else if (identifier.startsWith('T')) {
            value = ID3Frames.GENERIC_TEXT.read(frameBody)
        } else if (identifier.startsWith('W')) {
            value = ID3Frames.GENERIC_URL.read(frameBody)
        } else {
            return null
        }
        return new Frame(identifier, value, frameHeader.flags)
    }

    getBuffer() {
        const Frames = ID3Frames.Frames
        if (this.identifier in Frames) {
            return Frames[this.identifier as FrameKeys].create(this.value)
        }
        if (this.identifier.startsWith('T')) {
            return ID3Frames.GENERIC_TEXT.create(this.identifier, this.value)
        }
        if (this.identifier.startsWith('W')) {
            return ID3Frames.GENERIC_URL.create(this.identifier, this.value)
        }
        return null
    }

    getValue() {
        return this.value
    }
}

function decompressBody(
    flags: Flags,
    frameBuffer: Buffer,
    dataLengthOffset: number,
    frameBody: Buffer
) {
    let dataLength = 0
    if (flags.dataLengthIndicator) {
        dataLength = frameBuffer.readInt32BE(dataLengthOffset)
    }
    if (flags.compression) {
        return decompressBuffer(frameBody, dataLength)
    }
    return frameBody
}


function decompressBuffer(buffer: Buffer, expectedDecompressedLength: number) {
    if (buffer.length < 5 || expectedDecompressedLength === undefined) {
        return null
    }

    // ID3 spec defines that compression is stored in ZLIB format,
    // but doesn't specify if header is present or not.
    // ZLIB has a 2-byte header.
    // 1. try if header + body decompression
    // 2. else try if header is not stored (assume that all content is deflated "body")
    // 3. else try if inflation works if the header is omitted (implementation dependent)
    const tryDecompress = () => {
        try {
            return zlib.inflateSync(buffer)
        } catch (error) {
            try {
                return zlib.inflateRawSync(buffer)
            } catch (error) {
                try {
                    return zlib.inflateRawSync(buffer.subarray(2))
                } catch (error) {
                    return null
                }
            }
        }
    }
    const decompressed = tryDecompress()
    if (!decompressed || decompressed.length !== expectedDecompressedLength) {
        return null
    }
    return decompressed
}
