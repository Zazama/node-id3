import { Tags, TagAliases, RawTags, WriteTags  } from "./Tags"
import {
    FrameOptions,
    FRAME_IDENTIFIERS,
    FRAME_ALIASES
} from "./ID3Definitions"
import * as ID3Util from "./ID3Util"


// TODO: Convertion to typescript need to be cleaned up, it has been quickly
// hacked for now.
export function updateTags(newTags: WriteTags, currentTags: Tags): RawTags {

    const newRawTags = makeRawTags(newTags)

    // eslint-disable-next-line
    const read = <T extends {}>
        (object: T, index: string) => object[index as keyof T]

    // eslint-disable-next-line
    const currentRawTags: Record<string, any> = currentTags.raw ?? {}
    Object.entries(newRawTags).map(([frameIdentifierString, frame]) => {
        const frameIdentifier = frameIdentifierString as keyof RawTags
        const options: FrameOptions = ID3Util.getSpecOptions(frameIdentifier)
        const newTag = newRawTags[frameIdentifier]
        const currentTag = currentRawTags[frameIdentifier]
        if (options.multiple && newTag && currentTag) {
            const cCompare: Record<string, number> = {}
            if (options.updateCompareKey) {
                (currentTag as []).forEach((cTag, index) => {
                    // eslint-disable-next-line
                    cCompare[cTag[options.updateCompareKey!]] = index
                })

            }
            const newTagArray = newTag instanceof Array ? newTag : [newTag]
            newTagArray.forEach((tagValue) => {
                const tagProperty =
                    // eslint-disable-next-line
                    read(tagValue, options.updateCompareKey!) as string
                if (tagProperty in cCompare) {
                    const comparison = cCompare[tagProperty]
                    currentRawTags[frameIdentifier][comparison] = tagValue
                } else {
                    currentRawTags[frameIdentifier].push(tagValue)
                }
            })
        } else {
            currentRawTags[frameIdentifier] = frame
        }
    })
    return currentRawTags
}

function makeRawTags(tags: WriteTags): RawTags {
    return Object.entries(tags).reduce<RawTags>((rawTags, [key, value]) => {
        const identifiers = FRAME_IDENTIFIERS.v34
        const aliases = FRAME_ALIASES.v34
        if (key in identifiers) {
            rawTags[identifiers[key as keyof TagAliases]] = value
        }
        if (key in aliases) {
            rawTags[key as keyof RawTags] = value
        }
        return rawTags
    }, {})
}
