import iconv = require('iconv-lite')
import { FrameOptions, FRAME_OPTIONS } from './definitions/FrameOptions'
import { isString } from './util'

export class SplitBuffer {
    value: Buffer | null
    remainder: Buffer | null
    constructor(value: Buffer | null = null, remainder: Buffer | null = null) {
        this.value = value
        this.remainder = remainder
    }
}

export function splitNullTerminatedBuffer(buffer: Buffer, encodingByte = 0x00) {
    const termination = { start: -1, size: 0 }
    if (encodingByte === 0x01 || encodingByte === 0x02) {
        termination.start = buffer.indexOf(Buffer.from([0x00, 0x00]))
        termination.size = 2
        if (
            termination.start !== -1 &&
            buffer.length > (termination.start + termination.size)
        ) {
            if (buffer[termination.start + termination.size] === 0x00) {
                termination.start += 1
            }
        }
    } else {
        termination.start = buffer.indexOf(0x00)
        termination.size = 1
    }

    if (termination.start === -1) {
        return new SplitBuffer(null, buffer.subarray(0))
    }
    if (buffer.length <= termination.start + termination.size) {
        return new SplitBuffer(buffer.subarray(0, termination.start), null)
    }
    return new SplitBuffer(
        buffer.subarray(0, termination.start),
        buffer.subarray(termination.start + termination.size)
    )
}

export function encodingFromStringOrByte(encoding: string | number) {
    const ENCODINGS = [
        'ISO-8859-1', 'UTF-16', 'UTF-16BE', 'UTF-8'
    ]

    if (isString(encoding) && ENCODINGS.includes(encoding)) {
        return encoding
    }
    if (
        typeof encoding === "number" &&
        encoding >= 0 && encoding < ENCODINGS.length
    ) {
        return ENCODINGS[encoding]
    }
    return ENCODINGS[0]
}

export function stringToEncodedBuffer(
    value: string,
    encodingByte: string | number
) {
    return iconv.encode(
        value,
        encodingFromStringOrByte(encodingByte)
    )
}

export function bufferToDecodedString(
    buffer: Buffer,
    encodingByte: string | number
) {
    return iconv.decode(
        buffer,
        encodingFromStringOrByte(encodingByte)
    ).replace(/\0/g, '')
}

export function getSpecOptions(frameIdentifier: string): FrameOptions {
    if (frameIdentifier in FRAME_OPTIONS) {
        return FRAME_OPTIONS[frameIdentifier as keyof typeof FRAME_OPTIONS]
    }
    return {
        multiple: false
    }
}

export function isValidID3Header(buffer: Buffer) {
    if (buffer.length < 10) {
        return false
    }
    if (buffer.readUIntBE(0, 3) !== 0x494433) {
        return false
    }
    if ([0x02, 0x03, 0x04].indexOf(buffer[3]) === -1 || buffer[4] !== 0x00) {
        return false
    }
    return isValidEncodedSize(buffer.subarray(6, 10))
}

export function getFramePosition(buffer: Buffer) {
    // Search Buffer for valid ID3 frame
    let framePosition = -1
    let frameHeaderValid = false
    do {
        framePosition = buffer.indexOf("ID3", framePosition + 1)
        if (framePosition !== -1) {
            // It's possible that there is a "ID3" sequence without being an
            // ID3 Frame, so we need to check for validity of the next 10 bytes.
            frameHeaderValid = isValidID3Header(
                buffer.subarray(framePosition, framePosition + 10)
            )
        }
    } while (framePosition !== -1 && !frameHeaderValid)

    if (!frameHeaderValid) {
        return -1
    }
    return framePosition
}

 export function isValidEncodedSize(encodedSize: Buffer) {
    // The size must not have the bit 7 set
    return ((
        encodedSize[0] |
        encodedSize[1] |
        encodedSize[2] |
        encodedSize[3]
    ) & 128) === 0
}

/**
 * ID3 header size uses only 7 bits of a byte, bit shift is needed.
 * @returns Return a Buffer of 4 bytes with the encoded size
 */
 export function encodeSize(size: number) {
    const byte_3 = size & 0x7F
    const byte_2 = (size >> 7) & 0x7F
    const byte_1 = (size >> 14) & 0x7F
    const byte_0 = (size >> 21) & 0x7F
    return Buffer.from([byte_0, byte_1, byte_2, byte_3])
}

/**
 * Decode the encoded size from an ID3 header.
 */
 export function decodeSize(encodedSize: Buffer) {
    return (
        (encodedSize[0] << 21) +
        (encodedSize[1] << 14) +
        (encodedSize[2] << 7) +
        encodedSize[3]
    )
}

export function getFrameSize(buffer: Buffer, decode: boolean, version: number) {
    const decodeBytes = version > 2 ?
        [buffer[4], buffer[5], buffer[6], buffer[7]] :
        [buffer[3], buffer[4], buffer[5]]
    if (decode) {
        return decodeSize(Buffer.from(decodeBytes))
    }
    return Buffer.from(decodeBytes).readUIntBE(0, decodeBytes.length)
}

export function parseTagHeaderFlags(header: Buffer) {
    if (!(header instanceof Buffer && header.length >= 10)) {
        return {}
    }
    const version = header[3]
    const flagsByte = header[5]
    if (version === 3) {
        return {
            unsynchronisation: !!(flagsByte & 128),
            extendedHeader: !!(flagsByte & 64),
            experimentalIndicator: !!(flagsByte & 32)
        }
    }
    if (version === 4) {
        return {
            unsynchronisation: !!(flagsByte & 128),
            extendedHeader: !!(flagsByte & 64),
            experimentalIndicator: !!(flagsByte & 32),
            footerPresent: !!(flagsByte & 16)
        }
    }
    return {}
}

export function processUnsynchronisedBuffer(buffer: Buffer) {
    const newDataArr = []
    if (buffer.length > 0) {
        newDataArr.push(buffer[0])
    }
    for(let i = 1; i < buffer.length; i++) {
        if (buffer[i - 1] === 0xFF && buffer[i] === 0x00) {
            continue
        }
        newDataArr.push(buffer[i])
    }
    return Buffer.from(newDataArr)
}

export function getPictureMimeTypeFromBuffer(pictureBuffer: Buffer) {
    if (
        pictureBuffer.length > 3 &&
        pictureBuffer.compare(Buffer.from([0xff, 0xd8, 0xff]), 0, 3, 0, 3) === 0
    ) {
        return "image/jpeg"
    }
    if (
        pictureBuffer.length > 8 &&
        pictureBuffer.compare(Buffer.from([0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A]), 0, 8, 0, 8) === 0
    ) {
        return "image/png"
    }
    return null
}
