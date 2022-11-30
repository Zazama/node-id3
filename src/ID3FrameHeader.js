const ID3Util = require('./ID3Util')
const ID3Definitions = require("./ID3Definitions")

class ID3FrameHeader {
    constructor(identifier, frameSize, flags = {}) {
        this.identifier = identifier
        this.frameSize = frameSize
        this.flags = flags
    }

    static createFromBuffer(headerBuffer, version) {
        const identifierSize = (version === 2) ? 3 : 4
        let identifier = headerBuffer.toString('utf8', 0, identifierSize)
        const frameSize = this.getFrameSizeFromBuffer(headerBuffer, version)
        const flags = this.getFlagsFromBytes(headerBuffer[8], headerBuffer[9], version)

        // Try to convert identifier for older versions
        if(version === 2) {
            const alias = ID3Definitions.FRAME_INTERNAL_IDENTIFIERS.v2[identifier]
            if(alias) {
                frameIdentifier = ID3Definitions.FRAME_IDENTIFIERS.v3[alias]
            }
        }

        return new ID3FrameHeader(identifier, frameSize, flags)
    }

    getBuffer() {
        const buffer = Buffer.alloc(10)
        buffer.write(this.identifier, 0)
        buffer.writeUInt32BE(this.frameSize, 4)
        return buffer
    }

    static getSizeByVersion(version) {
        return (version === 2) ? 6 : 10
    }

    static getFrameSizeFromBuffer(headerBuffer, version) {
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

    static getFlagsFromBytes(statusFlag, encodingFlag, version) {
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
}

module.exports = ID3FrameHeader