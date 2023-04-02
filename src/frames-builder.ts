import { convertWriteTagsToRawTags } from "./TagsConverters"
import { Frames } from "./frames/frames"
import { WriteTags } from "./types/Tags"
import { deduplicate, isBuffer, isKeyOf, isNotUndefinedEntry } from "./util"
import * as GenericFrames from './frames/generic'
import { getFrameOptions } from "./ID3Util"

/**
 * Returns a buffer with the frames for the specified tags.
 */
export function buildFramesBuffer(tags?: WriteTags) {
    return Buffer.concat(buildFramesBuffers(tags))
}

/**
 * Returns an array of buffers using specified tags.
 */
function buildFramesBuffers(tags?: WriteTags): Buffer[] {
    if(!tags) {
        return []
    }
    const rawTags = convertWriteTagsToRawTags(tags)
    return Object.entries(rawTags)
        .filter(isNotUndefinedEntry)
        .map(([identifier, value]) => buildFrameBuffer(identifier, value))
        .filter(isBuffer)
}

function buildFrameBuffer(identifier: string, value: unknown) {
    if (isKeyOf(identifier, Frames)) {
        return handleMultipleAndBuildFrameBuffer(
            identifier,
            value,
            Frames[identifier].create
        )
    }
    if (identifier.startsWith('T')) {
        return GenericFrames.GENERIC_TEXT.create(identifier, value as string)
    }
    if (identifier.startsWith('W')) {
        return handleMultipleAndBuildFrameBuffer(
            identifier,
            value,
            url => GenericFrames.GENERIC_URL.create(identifier, url),
            deduplicate
        )
    }
    return null
}

function handleMultipleAndBuildFrameBuffer<
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    Create extends (value: any, index: number) => Buffer | null
>(
    identifier: string,
    data: unknown,
    create: Create,
    deduplicate = (values: ([Parameters<Create>])[]) => values
) {
    const values = makeValueArray(identifier, data)
    const frames = deduplicate(values)
        .map(create)
        .filter(isBuffer)
    return frames.length ? Buffer.concat(frames) : null
}

/**
 * Throws if an array is given but not expected, i.e. the contract is not
 * respected, otherwise always return an array.
 */
function makeValueArray(identifier: string, data: unknown) {
    const isMultiple = getFrameOptions(identifier).multiple
    const isArray = Array.isArray(data)
    if (!isMultiple && isArray) {
        throw new TypeError(`Unexpected array for frame ${identifier}`)
    }
    return isMultiple && isArray ? data : [data]
}

