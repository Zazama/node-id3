import { Frame } from './Frame'
import { getFrameSize } from './FrameHeader'
import { Options } from "./types/Options"
import { Tags, TagIdentifiers } from './types/Tags'
import { convertRawTagsToTagAliases } from "./TagsConverters"
import { getFrameOptions } from './util-frame-options'

type FramesData = {
    buffer: Buffer
    version: number
}

export function getTags(
    framesData: FramesData | undefined,
    options: Options = {}
) {
    const { buffer, version } =
        framesData ?? { buffer: Buffer.alloc(0), version: 3 }

    const frames = decodeFrames(buffer, version, options)
    return convertFramesToTags(frames, version, options)
}

function convertFramesToTags(
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

function decodeFrames(
    buffer: Buffer,
    version: number,
    options: Options = {}
): Frame[] {
    const frames = []
    while(buffer.length && buffer[0] !== 0x00) {
        const frameSize = getFrameSize(buffer, version)

        // Prevent errors due to broken data.
        if (frameSize > buffer.length) {
            break
        }

        const frameBuffer = buffer.subarray(0, frameSize)
        const frame = Frame.createFromBuffer(frameBuffer, version)
        if (frame && !isFrameDiscarded(frame.identifier, options)) {
            frames.push(frame)
        }

        buffer = buffer.subarray(frameSize)
    }
    return frames
}

function isFrameDiscarded(frameId: string, options: Options) {
    if (Array.isArray(options.exclude) && options.exclude.includes(frameId)) {
        return true
    }
    return Array.isArray(options.include) && !options.include.includes(frameId)
}
