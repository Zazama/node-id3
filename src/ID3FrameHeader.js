const ID3Util = require('./ID3Util')
import {
    FRAME_IDENTIFIERS,
    FRAME_ALIASES }
from "./definitions/FrameIdentifiers"

class ID3FrameHeader {
    constructor(identifier, bodySize, flags = {}) {
        this.identifier = identifier
        this.bodySize = bodySize
        this.flags = flags
    }

    getBuffer() {
        const buffer = Buffer.alloc(10)
        buffer.write(this.identifier, 0)
        buffer.writeUInt32BE(this.bodySize, 4)
        return buffer
    }

}

export function createFromBuffer(headerBuffer, version) {
    const identifierSize = (version === 2) ? 3 : 4
    let identifier = headerBuffer.toString('utf8', 0, identifierSize)
    const frameSize = getBodySize(headerBuffer, version)
    const flags = extractFlags(headerBuffer[8], headerBuffer[9], version)

    // Try to convert identifier for older versions
    if(version === 2) {
        const alias = FRAME_ALIASES.v2[identifier]
        if(alias) {
            identifier = FRAME_IDENTIFIERS.v34[alias]
        }
    }

    return new ID3FrameHeader(identifier, frameSize, flags)
}

function extractFlags(statusFlag, encodingFlag, version) {
    if(version === 2) {
        return {}
    }

    if(version === 3) {
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

    if(version === 4) {
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

export function getHeaderSize(version) {
    return (version === 2) ? 6 : 10
}

function getBodySize(headerBuffer, version) {
    const isDecoded = version === 4
    let bytes
    if(version === 2) {
        bytes = [headerBuffer[3], headerBuffer[4], headerBuffer[5]]
    } else {
        bytes = [headerBuffer[4], headerBuffer[5], headerBuffer[6], headerBuffer[7]]
    }
    if(isDecoded) {
        return ID3Util.decodeSize(Buffer.from(bytes))
    }

    return Buffer.from(bytes).readUIntBE(0, bytes.length)
}

export function getFrameSize(buffer, version) {
    return getHeaderSize(version) + getBodySize(buffer)
}