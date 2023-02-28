import { FrameBuilder } from "../FrameBuilder"
import { FrameReader } from "../FrameReader"
import * as TagsHelpers from '../TagsHelpers'
import type { Data } from "./type"

export const CHAP = {
    create: (data: Data) => {
        if (!(data instanceof Array)) {
            data = [data]
        }

        return Buffer.concat(data.map((chap: Data) => {
            if (!chap || !chap.elementID || typeof chap.startTimeMs === "undefined" || !chap.endTimeMs) {
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
        }).filter((chap: Data) => chap instanceof Buffer))
    },
    read: (buffer: Buffer) => {
        const reader = new FrameReader(buffer)

        const consumeNumber = () => reader.consumeStaticValue('number', 4)

        const makeOffset = (value: number) => value === 0xFFFFFFFF ? null : value

        const elementID = reader.consumeNullTerminatedValue('string')
        const startTimeMs = consumeNumber()
        const endTimeMs = consumeNumber()
        const startOffsetBytes = makeOffset(consumeNumber())
        const endOffsetBytes = makeOffset(consumeNumber())
        const tags = TagsHelpers.getTagsFromTagBody(reader.consumeStaticValue())
        return {
            elementID,
            startTimeMs,
            endTimeMs,
            ...startOffsetBytes === null ? {} : {startOffsetBytes},
            ...endOffsetBytes === null ? {} : {endOffsetBytes},
            tags
        }
    }
}
