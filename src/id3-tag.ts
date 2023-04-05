import { buildFramesBuffer } from "./frames-builder"
import { getTags } from "./frames-reader"
import { Options } from "./types/Options"
import { WriteTags } from "./types/Tags"
import { decodeSize, encodeSize } from "./util-size"

const Header = {
    identifier: "ID3",
    size: 10,
    offset: {
        identifier: 0,  // 3 bytes
        version: 3,     // major version: 1 byte
        revision: 4,    // 1 byte
        flags: 5,       // 1 byte
        size: 6         // 4 bytes
    }
} as const

/**
 * ID3v2 Header
 */
type TagHeader = {
    /**
     * The sum of the header size and the tag data size.
     */
    tagSize: number
    /**
     * Version format is v2.major.revision
     */
    version: {
        /**
         * Major versions are not backwards compatible.
         */
        major: number
        /**
         * Revisions are backwards compatible.
         */
        revision: number
    }
    flags: TagHeaderFlags
}

type TagHeaderFlags = {
    /**
     * Indicates whether or not unsynchronisation is applied on all frames
     * (see section 6.1 for details); true indicates usage.
     */
    unsynchronisation: boolean
    /**
     * Indicates whether or not the header is followed by an extended
     * header. The extended header is described in section 3.2.
     * True indicates the presence of an extended header.
     */
    extendedHeader: boolean
    /**
     * This flag SHALL always be set when the tag is in an experimental stage.
     */
    experimentalIndicator: boolean
    /**
     * A footer (section 3.4) is present at the very end of the tag.
     * True indicates the presence of a footer.
     */
    footerPresent?: boolean
}

const subarray = (buffer: Buffer, offset: number, size: number) =>
    buffer.subarray(offset, offset + size)

export function createId3Tag(tags: WriteTags) {
    const frames = buildFramesBuffer(tags)
    return embedFramesInId3Tag(frames)
}

export function embedFramesInId3Tag(frames: Buffer) {
    const header = Buffer.alloc(Header.size)
    header.fill(0)
    header.write(Header.identifier, Header.offset.identifier)
    header.writeUInt16BE(0x0300, Header.offset.version)
    header.writeUInt16BE(0x0000, Header.offset.flags)
    encodeSize(frames.length).copy(header, Header.offset.size)

    return Buffer.concat([header, frames])
}

/**
 * Remove already written ID3-Frames from a buffer
 */
export function removeId3Tag(data: Buffer) {
    const tagPosition = findId3TagPosition(data)
    if (tagPosition === -1) {
        return data
    }
    const encodedSize = subarray(data, tagPosition + Header.offset.size, 4)

    if (!isValidEncodedSize(encodedSize)) {
        return false
    }

    if (data.length >= tagPosition + Header.size) {
        const size = decodeSize(encodedSize)
        return Buffer.concat([
            data.subarray(0, tagPosition),
            data.subarray(tagPosition + size + Header.size)
        ])
    }

    return data
}

export function getTagsFromId3Tag(buffer: Buffer, options: Options) {
    const tagBody = getId3TagBody(buffer)
    return getTags(tagBody, options)
}

export function getId3TagSize(buffer: Buffer): number {
    const encodedSize = subarray(buffer, Header.offset.size, 4)
    return Header.size + decodeSize(encodedSize);
}

function getId3TagBody(buffer: Buffer) {
    const tagPosition = findId3TagPosition(buffer)
    if (tagPosition === -1) {
        return undefined
    }
    const tagBuffer = buffer.subarray(tagPosition)
    const tagHeader = decodeId3TagHeader(tagBuffer)
    const totalHeaderSize =
        Header.size + getExtendedHeaderSize(tagHeader, tagBuffer)
    const bodySize = tagHeader.tagSize - totalHeaderSize

    // Copy for now, it might not be necessary, but we are not really sure for
    // now, will be re-assessed if we can avoid the copy.
    const body = Buffer.alloc(bodySize)
    tagBuffer.copy(body, 0, totalHeaderSize)

    return {
        version: tagHeader.version.major,
        buffer: body
    }
}

/**
 * @param tagBuffer A buffer starting with a valid id3 tag header.
 * @returns The size of the extended header.
 */
function getExtendedHeaderSize(header: TagHeader, tagBuffer: Buffer) {
    if (header.flags.extendedHeader) {
        if (header.version.major === 3) {
            return 4 + tagBuffer.readUInt32BE(Header.size)
        }
        if (header.version.major === 4) {
            return decodeSize(subarray(tagBuffer, Header.size, 4))
        }
    }
    return 0
}

/**
 * @param tagBuffer A buffer starting with a valid id3 tag header.
 * @returns The decoded header.
 */
function decodeId3TagHeader(tagBuffer: Buffer): TagHeader {
    return {
        tagSize: decodeId3TagSize(tagBuffer),
        version: {
            major: tagBuffer[Header.offset.version],
            revision: tagBuffer[Header.offset.revision]
        },
        flags: parseTagHeaderFlags(tagBuffer)
    }
}

/**
 * @param tagBuffer A buffer starting with a valid id3 tag header.
 * @returns The size of tag including the header.
 */
function decodeId3TagSize(tagBuffer: Buffer) {
    const encodedSize = subarray(tagBuffer, Header.offset.size, 4)
    return Header.size + decodeSize(encodedSize)
}

function parseTagHeaderFlags(header: Buffer): TagHeaderFlags {
    const version = header[Header.offset.version]
    const flagsByte = header[Header.offset.flags]
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
    return {
        unsynchronisation: false,
        extendedHeader: false,
        experimentalIndicator: false
    }
}

/**
 * Returns the position of the first valid tag found or -1 if no tag was found.
 */
export function findId3TagPosition(buffer: Buffer) {
    // Search Buffer for valid ID3 frame
    let position = -1
    do {
        position = buffer.indexOf(Header.identifier, position + 1)
        if (position !== -1) {
            // It's possible that there is a "ID3" sequence without being an
            // ID3 Frame, so we need to check for validity of the next 10 bytes.
            if (isValidId3Header(buffer.subarray(position))) {
                return position
            }
        }
    } while (position !== -1)
    return -1
}

function isValidId3Header(buffer: Buffer) {
    // From id3.org:
    // An ID3v2 tag can be detected with the following pattern:
    // $49 44 33 yy yy xx zz zz zz zz
    // Where yy is less than $FF, xx is the 'flags' byte and zz is less than
    // $80.
    if (buffer.length < Header.size) {
        return false
    }
    const identifier = buffer.readUIntBE(Header.offset.identifier, 3)
    if (identifier !== 0x494433) {
        return false
    }
    const majorVersion = buffer[Header.offset.version]
    const revision = buffer[Header.offset.revision]
    if (majorVersion === 0xFF || revision === 0xFF) {
        return false
    }
    // This library currently only handle these versions.
    if ([0x02, 0x03, 0x04].indexOf(majorVersion) === -1) {
        return false
    }
    return isValidEncodedSize(subarray(buffer, Header.offset.size, 4))
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
