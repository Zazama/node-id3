import { Frame } from './Frame'
import { getFrameSize } from './FrameHeader'
import { Options } from "./types/Options"
import { Tags, TagIdentifiers } from './types/Tags'
import { isBuffer } from "./util"
import { convertRawTagsToTagAliases } from "./TagsConverters"
import { getId3TagBody } from './id3-tag'
import { getFrameOptions } from './util-frame-options'

export function getTagsFromBuffer(buffer: Buffer, options: Options) {
    const tagBody = getId3TagBody(buffer)
    if (tagBody === undefined) {
        return getTagsFromFrames([], 3, options)
    }
    return getTagsFromTagBody(tagBody.body, tagBody.version, options)
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
        const isMultiple = getFrameOptions(frameId).multiple
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
