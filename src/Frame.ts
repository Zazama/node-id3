import zlib = require('zlib')
import {
    Flags,
    getHeaderSize,
    FrameHeader
} from './FrameHeader'
import * as GenericFrames from './frames/generic'
import { Frames } from './frames/frames'
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

    static createFromBuffer = createFromBuffer

    getValue() {
        return this.value
    }
}

type FrameData = {
    header: HeaderInfo
    body: Buffer
}

function getFrameDataFromFrameBuffer(
    frameBuffer: Buffer,
    version: number
): FrameData | null {
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
    return { header, body }
}

function createFromBuffer(
    frameBuffer: Buffer,
    version: number
): Frame | null {
    const frameData = getFrameDataFromFrameBuffer(frameBuffer, version)
    if (!frameData) {
        return null
    }
    const { header, body } = frameData
    const value = makeFrameValue(header.identifier, body, version)
    if (!value) {
        return null
    }
    return new Frame(header.identifier, value, header.flags)
}

function makeFrameValue(identifier:string, body: Buffer, version: number) {
    try {
        if (isKeyOf(identifier, Frames)) {
            return Frames[identifier].read(body, version)
        }
        if (identifier.startsWith('T')) {
            return GenericFrames.GENERIC_TEXT.read(body)
        }
        if (identifier.startsWith('W')) {
            return GenericFrames.GENERIC_URL.read(body)
        }
    } catch(error) {
        // On read ignore frames with errors
        return null
    }
    return null
}

function getBody({flags, headerSize, bodySize}: HeaderInfo, buffer: Buffer) {
    const bodyOffset = flags.dataLengthIndicator ? 4 : 0
    const bodyStart = headerSize + bodyOffset
    const bodyEnd = bodyStart + bodySize - bodyOffset
    const body = buffer.subarray(bodyStart, bodyEnd)
    if (flags.unsynchronisation) {
        // This method should stay in ID3Util for now because it's also used
        // in the Tag's header which we don't have a class for.
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
