import zlib = require('zlib')
import {
    Flags,
    getHeaderSize,
    FrameHeader
} from './FrameHeader'
import * as Frames from './Frames'
import * as ID3Util from './ID3Util'
import { isKeyOf } from "./util"

type HeaderInfo = {
    identifier: string
    headerSize: number
    bodySize: number
    flags: Flags
}

export class Frame {
    identifier: string
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
        const headerSize = getHeaderSize(version)
        // Specification requirement
        if (frameBuffer.length < headerSize + 1) {
            return null
        }
        const headerBuffer = frameBuffer.subarray(0, headerSize)
        const header: HeaderInfo = {
            headerSize,
            ...FrameHeader.createFromBuffer(headerBuffer, version)
        }
        if (header.flags.encryption) {
            return null
        }

        const body = decompressBody(
            header.flags,
            getDataLength(header, frameBuffer),
            getBody(header, frameBuffer)
        )
        if (!body) {
            return null
        }

        const identifier = header.identifier
        let value = null
        if (isKeyOf(identifier, Frames.Frames)) {
            value = Frames.Frames[identifier].read(body, version)
        } else if (identifier.startsWith('T')) {
            value = Frames.GENERIC_TEXT.read(body)
        } else if (identifier.startsWith('W')) {
            value = Frames.GENERIC_URL.read(body)
        } else {
            return null
        }
        return new Frame(identifier, value, header.flags)
    }

    getBuffer() {
        if (isKeyOf(this.identifier, Frames.Frames)) {
            return Frames.Frames[this.identifier].create(this.value)
        }
        if (this.identifier.startsWith('T')) {
            return Frames.GENERIC_TEXT.create(this.identifier, this.value)
        }
        if (this.identifier.startsWith('W')) {
            return Frames.GENERIC_URL.create(this.identifier, this.value)
        }
        return null
    }

    getValue() {
        return this.value
    }
}

function getBody({flags, headerSize, bodySize}: HeaderInfo, buffer: Buffer) {
    const bodyOffset = flags.dataLengthIndicator ? 4 : 0
    const bodyStart = headerSize + bodyOffset
    const bodyEnd = bodyStart + bodySize - bodyOffset
    const body = buffer.subarray(bodyStart, bodyEnd)
    if (flags.unsynchronisation) {
        // This method should stay in ID3Util for now because it's also used in the Tag's header which we don't have a class for.
        return ID3Util.processUnsynchronisedBuffer(body)
    }
    return body
}

function getDataLength({flags, headerSize}: HeaderInfo, buffer: Buffer) {
    return flags.dataLengthIndicator ? buffer.readInt32BE(headerSize) : 0
}

function decompressBody(
    {compression}: Flags,
    dataLength: number,
    body: Buffer
) {
    return compression ? decompressBuffer(body, dataLength) : body
}

function decompressBuffer(buffer: Buffer, expectedDecompressedLength: number) {
    if (buffer.length < 5) {
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
    if (decompressed && decompressed.length === expectedDecompressedLength) {
        return decompressed
    }
    return null
}
