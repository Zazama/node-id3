const zlib = require('zlib')
const ID3Definitions = require("./ID3Definitions")
const ID3Frames = require('./ID3Frames')
const ID3Util = require('./ID3Util')

/**
 * Returns array of buffers created by tags specified in the tags argument
 * @param tags - Object containing tags to be written
 * @returns {Array}
 */
function createBuffersFromTags(tags) {
    const frames = []
    if(!tags) {
        return frames
    }
    const rawObject = Object.keys(tags).reduce((acc, val) => {
        if(ID3Definitions.FRAME_IDENTIFIERS.v3[val] !== undefined) {
            acc[ID3Definitions.FRAME_IDENTIFIERS.v3[val]] = tags[val]
        } else if(ID3Definitions.FRAME_IDENTIFIERS.v4[val] !== undefined) {
            /**
             * Currently, node-id3 always writes ID3 version 3.
             * However, version 3 and 4 are very similar, and node-id3 can also read version 4 frames.
             * Until version 4 is fully supported, as a workaround, allow writing version 4 frames into a version 3 tag.
             * If a reader does not support a v4 frame, it's (per spec) supposed to skip it, so it should not be a problem.
             */
            acc[ID3Definitions.FRAME_IDENTIFIERS.v4[val]] = tags[val]
        } else {
            acc[val] = tags[val]
        }
        return acc
    }, {})

    Object.keys(rawObject).forEach((specName) => {
        let frame
        // Check if invalid specName
        if(specName.length !== 4) {
            return
        }
        if(ID3Frames[specName] !== undefined) {
            frame = ID3Frames[specName].create(rawObject[specName], 3)
        } else if(specName.startsWith('T')) {
            frame = ID3Frames.GENERIC_TEXT.create(specName, rawObject[specName], 3)
        } else if(specName.startsWith('W')) {
            if(ID3Util.getSpecOptions(specName, 3).multiple && rawObject[specName] instanceof Array && rawObject[specName].length > 0) {
                frame = Buffer.alloc(0)
                // deduplicate array
                for(const url of [...new Set(rawObject[specName])]) {
                    frame = Buffer.concat([frame, ID3Frames.GENERIC_URL.create(specName, url, 3)])
                }
            } else {
                frame = ID3Frames.GENERIC_URL.create(specName, rawObject[specName], 3)
            }
        }

        if (frame && frame instanceof Buffer) {
            frames.push(frame)
        }
    })

    return frames
}

/**
 * Return a buffer with the frames for the specified tags
 * @param tags - Object containing tags to be written
 * @returns {Buffer}
 */
module.exports.createBufferFromTags = function(tags) {
    return Buffer.concat(createBuffersFromTags(tags))
}

module.exports.getTagsFromBuffer = function(filebuffer, options) {
    const framePosition = ID3Util.getFramePosition(filebuffer)
    if(framePosition === -1) {
        return getTagsFromFrames([], 3, options)
    }
    const frameSize = ID3Util.decodeSize(filebuffer.slice(framePosition + 6, framePosition + 10)) + 10
    const ID3Frame = Buffer.alloc(frameSize + 1)
    filebuffer.copy(ID3Frame, 0, framePosition)
    //ID3 version e.g. 3 if ID3v2.3.0
    const ID3Version = ID3Frame[3]
    const tagFlags = ID3Util.parseTagHeaderFlags(ID3Frame)
    let extendedHeaderOffset = 0
    if(tagFlags.extendedHeader) {
        if(ID3Version === 3) {
            extendedHeaderOffset = 4 + filebuffer.readUInt32BE(10)
        } else if(ID3Version === 4) {
            extendedHeaderOffset = ID3Util.decodeSize(filebuffer.slice(10, 14))
        }
    }
    const ID3FrameBody = Buffer.alloc(frameSize - 10 - extendedHeaderOffset)
    filebuffer.copy(ID3FrameBody, 0, framePosition + 10 + extendedHeaderOffset)

    const frames = getFramesFromID3Body(ID3FrameBody, ID3Version, options)

    return getTagsFromFrames(frames, ID3Version, options)
}

function getFramesFromID3Body(ID3FrameBody, ID3Version, options = {}) {
    let currentPosition = 0
    const frames = []
    if(!ID3FrameBody || !(ID3FrameBody instanceof Buffer)) {
        return frames
    }

    let identifierSize = 4
    let textframeHeaderSize = 10
    if(ID3Version === 2) {
        identifierSize = 3
        textframeHeaderSize = 6
    }

    while(currentPosition < ID3FrameBody.length && ID3FrameBody[currentPosition] !== 0x00) {
        const bodyFrameHeader = Buffer.alloc(textframeHeaderSize)
        ID3FrameBody.copy(bodyFrameHeader, 0, currentPosition)

        let decodeSize = false
        if(ID3Version === 4) {
            decodeSize = true
        }
        let bodyFrameSize = ID3Util.getFrameSize(bodyFrameHeader, decodeSize, ID3Version)
        if(bodyFrameSize + 10 > (ID3FrameBody.length - currentPosition)) {
            break
        }
        const specName = bodyFrameHeader.toString('utf8', 0, identifierSize)
        if(options.exclude instanceof Array && options.exclude.includes(specName) || options.include instanceof Array && !options.include.includes(specName)) {
            currentPosition += bodyFrameSize + textframeHeaderSize
            continue
        }
        const frameHeaderFlags = ID3Util.parseFrameHeaderFlags(bodyFrameHeader, ID3Version)
        if(frameHeaderFlags.dataLengthIndicator) {
            bodyFrameSize -= 4
        }
        const bodyFrameBuffer = Buffer.alloc(bodyFrameSize)
        ID3FrameBody.copy(bodyFrameBuffer, 0, currentPosition + textframeHeaderSize + (frameHeaderFlags.dataLengthIndicator ? 4 : 0))
        const frame = {
            name: specName,
            flags: frameHeaderFlags,
            body: frameHeaderFlags.unsynchronisation ? ID3Util.processUnsynchronisedBuffer(bodyFrameBuffer) : bodyFrameBuffer
        }
        if(frameHeaderFlags.dataLengthIndicator) {
            frame['dataLengthIndicator'] = ID3FrameBody.readInt32BE(currentPosition + textframeHeaderSize)
        }
        frames.push(frame)

        //  Size of sub frame + its header
        currentPosition += bodyFrameSize + textframeHeaderSize
    }

    return frames
}

function decompressFrame(frame) {
    if(frame.body.length < 5 || frame.dataLengthIndicator === undefined) {
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
        decompressedBody = zlib.inflateSync(frame.body)
    } catch (e) {
        try {
            decompressedBody = zlib.inflateRawSync(frame.body)
        } catch (e) {
            try {
                decompressedBody = zlib.inflateRawSync(frame.body.slice(2))
            } catch (e) {
                return null
            }
        }
    }
    if(decompressedBody.length !== frame.dataLengthIndicator) {
        return null
    }
    return decompressedBody
}

function getTagsFromFrames(frames, ID3Version, options = {}) {
    const tags = { }
    const raw = { }

    frames.forEach((frame) => {
        let specName
        let identifier
        if(ID3Version === 2) {
            specName = ID3Definitions.FRAME_IDENTIFIERS.v3[ID3Definitions.FRAME_INTERNAL_IDENTIFIERS.v2[frame.name]]
            identifier = ID3Definitions.FRAME_INTERNAL_IDENTIFIERS.v2[frame.name]
        } else if(ID3Version === 3 || ID3Version === 4) {
            /**
             * Due to their similarity, it's possible to mix v3 and v4 frames even if they don't exist in their corrosponding spec.
             * Programs like Mp3tag allow you to do so, so we should allow reading e.g. v4 frames from a v3 ID3 Tag
             */
            specName = frame.name
            identifier = ID3Definitions.FRAME_INTERNAL_IDENTIFIERS.v3[frame.name] || ID3Definitions.FRAME_INTERNAL_IDENTIFIERS.v4[frame.name]
        }

        if(!specName || !identifier || frame.flags.encryption) {
            return
        }

        if(frame.flags.compression) {
            const decompressedBody = decompressFrame(frame)
            if(!decompressedBody) {
                return
            }
            frame.body = decompressedBody
        }

        let decoded
        if(ID3Frames[specName]) {
            decoded = ID3Frames[specName].read(frame.body, ID3Version)
        } else if(specName.startsWith('T')) {
            decoded = ID3Frames.GENERIC_TEXT.read(frame.body, ID3Version)
        } else if(specName.startsWith('W')) {
            decoded = ID3Frames.GENERIC_URL.read(frame.body, ID3Version)
        }

        if(!decoded) {
            return
        }

        if(ID3Util.getSpecOptions(specName, ID3Version).multiple) {
            if(!options.onlyRaw) {
                if(!tags[identifier]) {
                    tags[identifier] = []
                }
                tags[identifier].push(decoded)
            }
            if(!options.noRaw) {
                if(!raw[specName]) {
                    raw[specName] = []
                }
                raw[specName].push(decoded)
            }
        } else {
            if(!options.onlyRaw) {
                tags[identifier] = decoded
            }
            if(!options.noRaw) {
                raw[specName] = decoded
            }
        }
    })

    if(options.onlyRaw) {
        return raw
    }
    if(options.noRaw) {
        return tags
    }

    tags.raw = raw
    return tags
}

module.exports.getTagsFromID3Body = function(body) {
    return getTagsFromFrames(getFramesFromID3Body(body, 3), 3)
}
