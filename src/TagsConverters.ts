import { RawTags, WriteTags } from "./types/Tags"
import {
    FRAME_IDENTIFIERS,
    FRAME_ALIASES
} from "./definitions/FrameIdentifiers"
import { isKeyOf } from "./util"

/**
 * Convert tag aliases from WriteTags to identifiers in RawTags and
 * filter out unknown aliases and identifiers.
 */
export function convertWriteTagsToRawTags(tags: WriteTags): RawTags {
    return Object.entries(tags).reduce<RawTags>((rawTags, [key, value]) => {
        if (isKeyOf(key, FRAME_IDENTIFIERS.v3)) {
            rawTags[FRAME_IDENTIFIERS.v3[key]] = value
        } else if (isKeyOf(key, FRAME_IDENTIFIERS.v4)) {
            // Currently, node-id3 always writes ID3 version 3.
            // However, version 3 and 4 are very similar, and node-id3
            // can also read version 4 frames.
            // Until version 4 is fully supported, as a workaround,
            // allow writing version 4 frames into a version 3 tag.
            // If a reader does not support a v4 frame, it's (per spec)
            // supposed to skip it, so it should not be a problem.
            rawTags[FRAME_IDENTIFIERS.v4[key]] = value
        } else if (isKeyOf(key, FRAME_ALIASES.v34)) {
            rawTags[key] = value
        }
        return rawTags
    }, {})
}

