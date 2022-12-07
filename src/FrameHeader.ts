import * as ID3Util from './ID3Util'
import {
    FRAME_IDENTIFIERS,
    FRAME_ALIASES }
from "./definitions/FrameIdentifiers"

export type Flags = {
    tagAlterPreservation?: boolean
    fileAlterPreservation?: boolean
    readOnly?: boolean
    compression?: boolean
    encryption?: boolean
    groupingIdentity?: boolean
    unsynchronisation?: boolean
    dataLengthIndicator?: boolean
}

export class FrameHeader {
    identifier: string
    bodySize: number
    flags: Flags

    constructor(identifier: string, bodySize: number, flags: Flags = {}) {
        this.identifier = identifier
        this.bodySize = bodySize
        this.flags = flags
    }

    static createFromBuffer = createFromBuffer

    getBuffer() {
        const buffer = Buffer.alloc(10)
        buffer.write(this.identifier, 0)
        buffer.writeUInt32BE(this.bodySize, 4)
        return buffer
    }

}

function createFromBuffer(headerBuffer: Buffer, version: number) {
    const identifierSize = version === 2 ? 3 : 4
    let identifier = headerBuffer.toString('utf8', 0, identifierSize)
    const frameSize = getBodySize(headerBuffer, version)
    const flags = extractFlags(headerBuffer[8], headerBuffer[9], version)

    // Try to convert identifier for older versions
    if (version === 2) {
        const aliasesV2: Record<string, string> = FRAME_ALIASES.v2
        const alias = aliasesV2[identifier]
        if (alias) {
            const identifiers: Record<string, string> = FRAME_IDENTIFIERS.v34
            identifier = identifiers[alias]
        }
    }

    return new FrameHeader(identifier, frameSize, flags)
}

function extractFlags(
    statusFlag: number,
    encodingFlag: number,
    version: number
) {
    if (version === 3) {
        return {
            tagAlterPreservation: !!(statusFlag & 128),
            fileAlterPreservation: !!(statusFlag & 64),
            readOnly: !!(statusFlag & 32),
            compression: !!(encodingFlag & 128),
            encryption: !!(encodingFlag & 64),
            groupingIdentity: !!(encodingFlag & 32),
            dataLengthIndicator: !!(encodingFlag & 128)
        }
    }
    if (version === 4) {
        return {
            tagAlterPreservation: !!(statusFlag & 64),
            fileAlterPreservation: !!(statusFlag & 32),
            readOnly: !!(statusFlag & 16),
            groupingIdentity: !!(encodingFlag & 64),
            compression: !!(encodingFlag & 8),
            encryption: !!(encodingFlag & 4),
            unsynchronisation: !!(encodingFlag & 2),
            dataLengthIndicator: !!(encodingFlag & 1)
        }
    }
    return {}
}

export function getHeaderSize(version: number) {
    return version === 2 ? 6 : 10
}

function getBodySize(headerBuffer: Buffer, version: number) {
    const isEncoded = version === 4

    const bytes = version === 2 ?
        [headerBuffer[3], headerBuffer[4], headerBuffer[5]] :
        [headerBuffer[4], headerBuffer[5], headerBuffer[6], headerBuffer[7]]

    if (isEncoded) {
        return ID3Util.decodeSize(Buffer.from(bytes))
    }
    return Buffer.from(bytes).readUIntBE(0, bytes.length)
}

export function getFrameSize(buffer: Buffer, version: number) {
    return getHeaderSize(version) + getBodySize(buffer, version)
}
