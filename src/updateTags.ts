import { Tags, TagIdentifiers, WriteTags  } from "./types/Tags"
import { FrameOptions } from "./definitions/FrameOptions"
import { convertWriteTagsToRawTags } from "./TagsConverters"
import * as ID3Util from "./ID3Util"


export function updateTags(newTags: WriteTags, currentTags: Tags): TagIdentifiers {
    const newRawTags = convertWriteTagsToRawTags(newTags)

    const currentRawTags = currentTags.raw ?? {}
    Object.keys(newRawTags).map(frameIdentifierString => {
        const frameIdentifier = frameIdentifierString as keyof TagIdentifiers
        const newFrame = newRawTags[frameIdentifier]
        const updatedFrame = updateFrameIfMultiple(
            ID3Util.getFrameOptions(frameIdentifier),
            newFrame,
            currentRawTags[frameIdentifier]
        )
        // eslint-disable-next-line
        currentRawTags[frameIdentifier] = (updatedFrame || newFrame) as any
    })
    return currentRawTags
}

function updateFrameIfMultiple(
    options: FrameOptions,
    newTag: TagIdentifiers[keyof TagIdentifiers],
    currentTag: TagIdentifiers[keyof TagIdentifiers],
) {
    if (
        !options.multiple ||
        !newTag ||
        !currentTag ||
        !Array.isArray(currentTag)
    ) {
        return null
    }

    const newTagArray = newTag instanceof Array ? newTag : [newTag]
    const compareKey = options.updateCompareKey
    if (!compareKey) {
        return [...currentTag, ...newTagArray]
    }

    const compareValueToFrameIndex: Record<string, number> = {}
    currentTag.forEach((tag, index) => {
        if (typeof tag === "object") {
              const compareValue = tag[compareKey as keyof typeof tag]
            compareValueToFrameIndex[compareValue] = index
        }
    })

    newTagArray.forEach((tagValue) => {
        // eslint-disable-next-line
        const assignableTagValue = tagValue as any
        if (
            typeof tagValue === "object" &&
            tagValue[compareKey as keyof typeof tagValue] in compareValueToFrameIndex
        ) {
            const tagProperty = tagValue[compareKey as keyof typeof tagValue]
            const frameIndex = compareValueToFrameIndex[tagProperty]
            currentTag[frameIndex] = assignableTagValue
        } else {
            currentTag.push(assignableTagValue)
        }
    })
    return currentTag
}
