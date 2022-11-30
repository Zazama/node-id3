const ID3Definitions = require("./ID3Definitions")
const ID3Frames = require('./ID3Frames')
const ID3Util = require('./ID3Util')
const ID3Frame = require('./ID3Frame')
const ID3FrameHeader = require('./ID3FrameHeader')

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

    Object.keys(rawObject).forEach((frameIdentifier) => {
        let frame
        // Check if invalid frameIdentifier
        if(frameIdentifier.length !== 4) {
            return
        }
        if(ID3Frames[frameIdentifier] !== undefined) {
            frame = ID3Frames[frameIdentifier].create(rawObject[frameIdentifier], 3)
        } else if(frameIdentifier.startsWith('T')) {
            frame = ID3Frames.GENERIC_TEXT.create(frameIdentifier, rawObject[frameIdentifier], 3)
        } else if(frameIdentifier.startsWith('W')) {
            if(ID3Util.getSpecOptions(frameIdentifier, 3).multiple && rawObject[frameIdentifier] instanceof Array && rawObject[frameIdentifier].length > 0) {
                frame = Buffer.alloc(0)
                // deduplicate array
                for(const url of [...new Set(rawObject[frameIdentifier])]) {
                    frame = Buffer.concat([frame, ID3Frames.GENERIC_URL.create(frameIdentifier, url, 3)])
                }
            } else {
                frame = ID3Frames.GENERIC_URL.create(frameIdentifier, rawObject[frameIdentifier], 3)
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

function isFrameDiscardedByOptions(frameIdentifier, options) {
    if(options.exclude instanceof Array && options.exclude.includes(frameIdentifier)) {
        return true
    }

    return options.include instanceof Array && !options.include.includes(frameIdentifier)
}

function getFramesFromID3Body(ID3TagBody, ID3Version, options = {}) {
    let currentPosition = 0
    const frames = []
    if(!ID3TagBody || !(ID3TagBody instanceof Buffer)) {
        return frames
    }

    while(currentPosition < ID3TagBody.length && ID3TagBody[currentPosition] !== 0x00) {
        const frameSize = ID3FrameHeader.getFrameSizeFromBuffer(ID3TagBody.subarray(currentPosition)) + ID3FrameHeader.getSizeByVersion(ID3Version)
        const frameBuffer = ID3TagBody.subarray(currentPosition, currentPosition + frameSize)
        const frame = ID3Frame.createFromBuffer(frameBuffer, ID3Version)
        // It's possible to discard frames via options.exclude/options.include
        // If that is the case, skip this frame and continue with the next
        if(!frame || isFrameDiscardedByOptions(frame.identifier, options)) {
            currentPosition += frameSize
            continue
        }
        // Prevent errors when the current frame's size exceeds the remaining tags size (e.g. due to broken size bytes).
        if(frameSize > (ID3TagBody.length - currentPosition)) {
            break
        }

        frames.push(frame)

        //  Size of frame body + its header
        currentPosition += frameSize
    }

    return frames
}

function getTagsFromFrames(frames, ID3Version, options = {}) {
    const tags = { }
    const raw = { }

    frames.forEach((frame) => {
        const frameValue = frame.getValue()
        const frameAlias = ID3Definitions.FRAME_INTERNAL_IDENTIFIERS.v3[frame.identifier] || ID3Definitions.FRAME_INTERNAL_IDENTIFIERS.v4[frame.identifier]

        if(ID3Util.getSpecOptions(frame.identifier, ID3Version).multiple) {
            if(!options.onlyRaw) {
                if(!tags[frameAlias]) {
                    tags[frameAlias] = []
                }
                tags[frameAlias].push(frameValue)
            }
            if(!options.noRaw) {
                if(!raw[frame.identifier]) {
                    raw[frame.identifier] = []
                }
                raw[frame.identifier].push(frameValue)
            }
        } else {
            if(!options.onlyRaw) {
                tags[frameAlias] = frameValue
            }
            if(!options.noRaw) {
                raw[frame.identifier] = frameValue
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
