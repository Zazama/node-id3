import { FRAME_ALIASES } from "./definitions/FrameIdentifiers"
import * as Frames from './Frames'
import * as ID3Util from './ID3Util'
import { Frame } from './Frame'
import { getFrameSize } from './FrameHeader'
import { Options } from "./types/Options"
import { Tags, RawTags, WriteTags } from './types/Tags'
import { deduplicate, isBuffer, isKeyOf } from "./util"
import { convertWriteTagsToRawTags } from "./TagsConverters"

/**
 * Returns an array of buffers using specified tags.
 */
function createBuffersFromTags(tags: WriteTags): Buffer[] {
    if(!tags) {
        return []
    }
    const rawTags = convertWriteTagsToRawTags(tags)

    const frames = Object.entries(rawTags).map(([frameIdentifier, data]) => {
        if (isKeyOf(frameIdentifier, Frames.Frames)) {
            return Frames.Frames[frameIdentifier].create(data)
        } else if (frameIdentifier.startsWith('T')) {
            return Frames.GENERIC_TEXT.create(frameIdentifier, data)
        } else if (frameIdentifier.startsWith('W')) {
            if (
                ID3Util.getSpecOptions(frameIdentifier).multiple &&
                Array.isArray(data)
            ) {
                const frames =
                    deduplicate(data)
                    .map(url => Frames.GENERIC_URL.create(frameIdentifier, url))
                    .filter(isBuffer)

                if (frames.length) {
                    return Buffer.concat(frames)
                }
            } else {
                return Frames.GENERIC_URL.create(frameIdentifier, data)
            }
        }
        return null
    })

    return frames.filter(isBuffer)
}

/**
 * Returns a buffer with the frames for the specified tags.
 */
export function createBufferFromTags(tags: WriteTags) {
    return Buffer.concat(createBuffersFromTags(tags))
}

export function getTagsFromBuffer(buffer: Buffer, options: Options) {
    const framePosition = ID3Util.getFramePosition(buffer)
    if(framePosition === -1) {
        return getTagsFromFrames([], 3, options)
    }
    const frameSize = ID3Util.decodeSize(buffer.subarray(framePosition + 6, framePosition + 10)) + 10
    const frame = Buffer.alloc(frameSize + 1)
    buffer.copy(frame, 0, framePosition)
    //ID3 version e.g. 3 if ID3v2.3.0
    const version = frame[3]
    const tagFlags = ID3Util.parseTagHeaderFlags(frame)
    let extendedHeaderOffset = 0
    if(tagFlags.extendedHeader) {
        if(version === 3) {
            extendedHeaderOffset = 4 + buffer.readUInt32BE(10)
        } else if(version === 4) {
            extendedHeaderOffset = ID3Util.decodeSize(buffer.subarray(10, 14))
        }
    }
    const frameBody = Buffer.alloc(frameSize - 10 - extendedHeaderOffset)
    buffer.copy(frameBody, 0, framePosition + 10 + extendedHeaderOffset)

    const frames = getFramesFromTagBody(frameBody, version, options)

    return getTagsFromFrames(frames, version, options)
}

function isFrameDiscarded(frameId: string, options: Options) {
    if (Array.isArray(options.exclude) && options.exclude.includes(frameId)) {
        return true
    }
    return Array.isArray(options.include) && !options.include.includes(frameId)
}

function getFramesFromTagBody(tagBody: Buffer, version: number, options = {}) {
    if(!(tagBody instanceof Buffer)) {
        return []
    }

    const frames = []
    while(tagBody.length && tagBody[0] !== 0x00) {
        const frameSize = getFrameSize(tagBody, version)

        // Prevent errors due to broken data.
        if (frameSize > tagBody.length) {
            break
        }

        const frameBuffer = tagBody.subarray(0, frameSize)
        const frame = Frame.createFromBuffer(frameBuffer, version)
        if(frame && !isFrameDiscarded(frame.identifier, options)) {
            frames.push(frame)
        }

        tagBody = tagBody.subarray(frameSize)
    }
    return frames
}

function getTagsFromFrames(
    frames: Frame[],
    _version: number,
    options: Options = {}
) {
    const tags: Tags = {}
    const raw: RawTags = {}

    const push = (dest: unknown, value: unknown) => {
        const destArray = Array.isArray(dest) ? dest : []
        destArray.push(value)
        return destArray as never
    }
    const set = (_dest: unknown, value: unknown) => value as never

    frames.forEach(frame => {
        const identifier = frame.identifier as keyof RawTags
        const frameAlias = FRAME_ALIASES.v34[identifier] as keyof Tags

        const assign = ID3Util.getSpecOptions(identifier).multiple ? push : set

        if (!options.onlyRaw) {
            tags[frameAlias] = assign(tags[frameAlias], frame.getValue())
        }
        if (!options.noRaw) {
            raw[identifier] = assign(raw[identifier], frame.getValue())
        }
    })

    if (options.onlyRaw) {
        return raw
    }
    if (options.noRaw) {
        return tags
    }

    tags.raw = raw
    return tags
}

export function getTagsFromID3Body(body: Buffer) {
    return getTagsFromFrames(getFramesFromTagBody(body, 3), 3)
}
