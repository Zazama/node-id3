const zlib = require('zlib')
const ID3FrameHeader = require('./ID3FrameHeader')
const ID3Frames = require('./ID3Frames')
const ID3Util = require('./ID3Util')

class ID3Frame {
    constructor(identifier, value, flags = {}) {
        this.identifier = identifier
        this.value = value
        this.dataLengthIndicator = 0
        this.flags = flags
    }

    static createFromBuffer(frameBuffer, version) {
        const frameHeaderSize = ID3FrameHeader.getSizeByVersion(version)
        // Specification requirement
        if(frameBuffer < frameHeaderSize + 1) {
            return null
        }
        const frameHeaderBuffer = frameBuffer.subarray(0, frameHeaderSize)
        const frameHeader = ID3FrameHeader.createFromBuffer(frameHeaderBuffer, version)
        if(frameHeader.flags.encryption) {
            return null
        }

        const frameBodyOffset = frameHeader.flags.dataLengthIndicator ? 4 : 0
        const frameBodyStart = frameHeaderSize + frameBodyOffset
        let frameBody = frameBuffer.subarray(frameBodyStart, frameBodyStart + frameHeader.frameSize - frameBodyOffset)
        if(frameHeader.flags.unsynchronisation) {
            // This method should stay in ID3Util for now because it's also used in the Tag's header which we don't have a class for.
            frameBody = ID3Util.processUnsynchronisedBuffer(frameBody)
        }
        if(frameHeader.flags.dataLengthIndicator) {
            this.dataLengthIndicator = frameBuffer.readInt32BE(frameHeaderSize)
        }
        if(frameHeader.flags.compression) {
            const uncompressedFrameBody = this.decompressBodyBuffer(frameBody, this.dataLengthIndicator)
            if(!uncompressedFrameBody) {
                return null
            }
            frameBody = uncompressedFrameBody
        }

        let value = null
        if(ID3Frames[frameHeader.identifier]) {
            value = ID3Frames[frameHeader.identifier].read(frameBody, version)
        } else if(frameHeader.identifier.startsWith('T')) {
            value = ID3Frames.GENERIC_TEXT.read(frameBody, version)
        } else if(frameHeader.identifier.startsWith('W')) {
            value = ID3Frames.GENERIC_URL.read(frameBody, version)
        } else {
            // Unknown frames are not supported currently.
            return null
        }

        return new ID3Frame(frameHeader.identifier, value, frameHeader.flags)
    }

    getBuffer() {
        if(ID3Frames[this.identifier]) {
            return ID3Frames[this.identifier].create(this.value)
        }
        if(this.identifier.startsWith('T')) {
            return ID3Frames.GENERIC_TEXT.create(this.value)
        }
        if(this.identifier.startsWith('W')) {
            return ID3Frames.GENERIC_URL.create(this.value)
        }

        return null
    }

    getValue() {
        return this.value
    }

    static decompressBodyBuffer(bodyBuffer, dataLengthIndicator) {
        if(bodyBuffer.length < 5 || dataLengthIndicator === undefined) {
            return null
        }

        /*
        * ID3 spec defines that compression is stored in ZLIB format, but doesn't specify if header is present or not.
        * ZLIB has a 2-byte header.
        * 1. try if header + body decompression
        * 2. else try if header is not stored (assume that all content is deflated "body")
        * 3. else try if inflation works if the header is omitted (implementation dependent)
        * */
        let decompressedBody
        try {
            decompressedBody = zlib.inflateSync(bodyBuffer)
        } catch (e) {
            try {
                decompressedBody = zlib.inflateRawSync(bodyBuffer)
            } catch (e) {
                try {
                    decompressedBody = zlib.inflateRawSync(bodyBuffer.subarray(2))
                } catch (e) {
                    return null
                }
            }
        }
        if(decompressedBody.length !== dataLengthIndicator) {
            return null
        }
        return decompressedBody
    }
}

module.exports = ID3Frame