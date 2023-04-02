import iconv = require('iconv-lite')
import { FrameOptions, FRAME_OPTIONS } from './definitions/FrameOptions'
import { isKeyOf, isString } from './util'

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
    if (isKeyOf(frameIdentifier, FRAME_OPTIONS)) {
        return FRAME_OPTIONS[frameIdentifier]
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

/**
 * Returns -1 if no tag was found.
 */
export function getTagPosition(buffer: Buffer) {
    // Search Buffer for valid ID3 frame
    const tagHeaderSize = 10
    let position = -1
    let headerValid = false
    do {
        position = buffer.indexOf("ID3", position + 1)
        if (position !== -1) {
            // It's possible that there is a "ID3" sequence without being an
            // ID3 Frame, so we need to check for validity of the next 10 bytes.
            headerValid = isValidID3Header(
                buffer.subarray(position, position + tagHeaderSize)
            )
        }
    } while (position !== -1 && !headerValid)

    if (!headerValid) {
        return -1
    }
    return position
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
