import * as ID3Util from './ID3Util'
import { makeFrameBuffer, Frame } from './Frame'
import { getFrameSize } from './FrameHeader'
import { Options } from "./types/Options"
import { Tags, TagIdentifiers, WriteTags } from './types/Tags'
import { isBuffer, isNotUndefinedEntry } from "./util"
import {
    convertWriteTagsToRawTags,
    convertRawTagsToTagAliases
} from "./TagsConverters"

/**
 * Returns an array of buffers using specified tags.
 */
function createBuffersFromTags(tags: WriteTags): Buffer[] {
    if(!tags) {
        return []
    }
    const rawTags = convertWriteTagsToRawTags(tags)
    return Object.entries(rawTags)
        .filter(isNotUndefinedEntry)
        .map(([identifier, value]) => makeFrameBuffer(identifier, value))
        .filter(isBuffer)
}

/**
 * Returns a buffer with the frames for the specified tags.
 */
export function createBufferFromTags(tags: WriteTags) {
    return Buffer.concat(createBuffersFromTags(tags))
}

export function getTagsFromBuffer(buffer: Buffer, options: Options) {
    const framePosition = ID3Util.getTagPosition(buffer)
    if (framePosition === -1) {
        return getTagsFromFrames([], 3, options)
    }
    const frameSize = ID3Util.decodeSize(buffer.subarray(framePosition + 6, framePosition + 10)) + 10
    const frame = Buffer.alloc(frameSize + 1)
    buffer.copy(frame, 0, framePosition)
    //ID3 version e.g. 3 if ID3v2.3.0
    const version = frame[3]
    const tagFlags = ID3Util.parseTagHeaderFlags(frame)
    let extendedHeaderOffset = 0
    if (tagFlags.extendedHeader) {
        if (version === 3) {
            extendedHeaderOffset = 4 + buffer.readUInt32BE(10)
        } else if(version === 4) {
            extendedHeaderOffset = ID3Util.decodeSize(buffer.subarray(10, 14))
        }
    }
    const frameBody = Buffer.alloc(frameSize - 10 - extendedHeaderOffset)
    buffer.copy(frameBody, 0, framePosition + 10 + extendedHeaderOffset)

    return getTagsFromTagBody(frameBody, version, options)
}

export function getTagsFromTagBody(
    body: Buffer,
    version = 3,
    options: Options = {}
) {
    return getTagsFromFrames(
        getFramesFromTagBody(body, version, options),
        version,
        options
    )
}

function isFrameDiscarded(frameId: string, options: Options) {
    if (Array.isArray(options.exclude) && options.exclude.includes(frameId)) {
        return true
    }
    return Array.isArray(options.include) && !options.include.includes(frameId)
}

function getFramesFromTagBody(
    tagBody: Buffer,
    version: number,
    options: Options = {}
) {
    if (!isBuffer(tagBody)) {
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
        if (frame && !isFrameDiscarded(frame.identifier, options)) {
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
): Tags | TagIdentifiers {
    const pushValue = (dest: unknown, value: unknown) => {
        const destArray = Array.isArray(dest) ? dest : []
        destArray.push(value)
        return destArray
    }
    const getValue = (_dest: unknown, value: unknown) => value

    const rawTags = frames.reduce<TagIdentifiers>((tags, frame) => {
        const frameId = frame.identifier as keyof TagIdentifiers
        const isMultiple = ID3Util.getSpecOptions(frameId).multiple
        const makeValue = isMultiple ? pushValue : getValue
        tags[frameId] = makeValue(tags[frameId], frame.getValue()) as never
        return tags
    }, {})

    if (options.onlyRaw) {
        return rawTags
    }

    const tags = convertRawTagsToTagAliases(rawTags)
    if (options.noRaw) {
        return tags
    }
    return { ...tags, raw: rawTags }
}
