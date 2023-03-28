import { FrameBuilder } from "../FrameBuilder"
import { FrameReader } from "../FrameReader"
import * as TagsHelpers from '../TagsHelpers'
import type { Chapter } from "../types/TagFrames"
import type { Tags, WriteTags } from "../types/Tags"

export const CHAP = {
    create: (chap: Chapter<WriteTags>) => {
        if (!chap.elementID
            || typeof chap.startTimeMs === "undefined"
            || !chap.endTimeMs
        ) {
            return null
        }
        const getOffset = (offset?: number) => offset ?? 0xFFFFFFFF
        return new FrameBuilder("CHAP")
            .appendNullTerminatedValue(chap.elementID)
            .appendNumber(chap.startTimeMs, 4)
            .appendNumber(chap.endTimeMs, 4)
            .appendNumber(getOffset(chap.startOffsetBytes), 4)
            .appendNumber(getOffset(chap.endOffsetBytes), 4)
            .appendValue(TagsHelpers.createBufferFromTags(chap.tags))
            .getBuffer()
    },
    read: (buffer: Buffer): Chapter<Tags> => {
        const reader = new FrameReader(buffer)

        const consumeNumber = () => reader.consumeNumber({size: 4})

        const makeOffset = (value: number) => value === 0xFFFFFFFF ? null : value

        const elementID = reader.consumeTerminatedText()
        const startTimeMs = consumeNumber()
        const endTimeMs = consumeNumber()
        const startOffsetBytes = makeOffset(consumeNumber())
        const endOffsetBytes = makeOffset(consumeNumber())
        return {
            elementID,
            startTimeMs,
            endTimeMs,
            ...startOffsetBytes === null ? {} : {startOffsetBytes},
            ...endOffsetBytes === null ? {} : {endOffsetBytes},
            tags: TagsHelpers.getTagsFromTagBody(
                reader.consumePossiblyEmptyBuffer()
            ) as Tags
        }
    }
}
