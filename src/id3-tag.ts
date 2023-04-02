import { decodeSize, encodeSize } from "./util-size"

export function createId3Tag(frames: Buffer) {
    const header = Buffer.alloc(10)
    header.fill(0)
    header.write("ID3", 0)              // File identifier
    header.writeUInt16BE(0x0300, 3)     // Version 2.3.0  --  03 00
    header.writeUInt16BE(0x0000, 5)     // Flags 00
    encodeSize(frames.length).copy(header, 6)

    return Buffer.concat([header, frames])
}

/**
 * Remove already written ID3-Frames from a buffer
 */
export function removeId3Tag(data: Buffer) {
    const tagPosition = getId3TagPosition(data)
    if (tagPosition === -1) {
        return data
    }

    const tagHeaderSize = 10
    const encodedSize = data.subarray(
        tagPosition + 6,
        tagPosition + tagHeaderSize
    )
    if (!isValidEncodedSize(encodedSize)) {
        return false
    }

    if (data.length >= tagPosition + tagHeaderSize) {
        const size = decodeSize(encodedSize)
        return Buffer.concat([
            data.subarray(0, tagPosition),
            data.subarray(tagPosition + size + tagHeaderSize)
        ])
    }

    return data
}

export function getId3TagBody(buffer: Buffer) {
    const tagPosition = getId3TagPosition(buffer)
    if (tagPosition === -1) {
        return undefined
    }
    const tagSize = 10 + decodeSize(
        buffer.subarray(tagPosition + 6, tagPosition + 10)
    )
    const tagData = buffer.subarray(tagPosition, tagPosition + tagSize)
    const tagHeader = tagData.subarray(0, 10)

    // ID3 version e.g. 3 if ID3v2.3.0
    const version = tagHeader[3]
    const tagFlags = parseTagHeaderFlags(tagHeader)
    let extendedHeaderOffset = 0
    if (tagFlags.extendedHeader) {
        if (version === 3) {
            extendedHeaderOffset = 4 + tagData.readUInt32BE(10)
        } else if(version === 4) {
            extendedHeaderOffset = decodeSize(tagData.subarray(10, 14))
        }
    }
    const totalHeaderSize = 10 + extendedHeaderOffset
    const bodySize = tagSize - totalHeaderSize

    // Copy for now, it might not be necessary, but we are not really sure for
    // now, will be re-assessed if we can avoid the copy.
    const tagBody = Buffer.alloc(bodySize)
    tagData.copy(tagBody, 0, totalHeaderSize)

    return {
        version, tagBody
    }
}

function parseTagHeaderFlags(header: Buffer) {
    if (header.length < 10) {
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

/**
 * Returns -1 if no tag was found.
 */
function getId3TagPosition(buffer: Buffer) {
    // Search Buffer for valid ID3 frame
    const tagHeaderSize = 10
    let position = -1
    let headerValid = false
    do {
        position = buffer.indexOf("ID3", position + 1)
        if (position !== -1) {
            // It's possible that there is a "ID3" sequence without being an
            // ID3 Frame, so we need to check for validity of the next 10 bytes.
            headerValid = isValidId3Header(
                buffer.subarray(position, position + tagHeaderSize)
            )
        }
    } while (position !== -1 && !headerValid)

    if (!headerValid) {
        return -1
    }
    return position
}

function isValidId3Header(buffer: Buffer) {
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

function isValidEncodedSize(encodedSize: Buffer) {
    // The size must not have the bit 7 set
    return ((
        encodedSize[0] |
        encodedSize[1] |
        encodedSize[2] |
        encodedSize[3]
    ) & 128) === 0
}
