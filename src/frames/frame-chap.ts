import { FrameBuilder } from "../FrameBuilder"
import { FrameReader } from "../FrameReader"
import { getTags } from '../frames-reader'
import { buildFramesBuffer } from "../frames-builder"
import type { Chapter } from "../types/TagFrames"
import type { Tags, WriteTags } from "../types/Tags"

export const CHAP = {
    create: (chap: Chapter<WriteTags>): Buffer => {
        if (chap.elementID == undefined
            || chap.startTimeMs == undefined
            || chap.endTimeMs == undefined
        ) {
            throw new TypeError(
                "elementID, startTimeMs, endTimeMs must all be provided"
            )
        }
        const getOffset = (offset?: number) => offset ?? 0xFFFFFFFF
        return new FrameBuilder("CHAP")
            .appendTerminatedText(chap.elementID)
            .appendNumber(chap.startTimeMs, {size: 4})
            .appendNumber(chap.endTimeMs, {size: 4})
            .appendNumber(getOffset(chap.startOffsetBytes), {size: 4})
            .appendNumber(getOffset(chap.endOffsetBytes), {size: 4})
            .appendBuffer(buildFramesBuffer(chap.tags))
            .getBufferWithPartialHeader()
    },
    read: (buffer: Buffer, version: number): Chapter<Tags> => {
        const reader = new FrameReader(buffer)

        // Returns a spreadable object to insert an optional offset property
        // when the consumed offset is valid.
        const consumeOffset= <Key extends keyof Chapter<never>>(key: Key) => {
            const offset = reader.consumeNumber({size: 4})
            return offset === 0xFFFFFFFF ? {} : {[key]: offset}
        }
        return {
            elementID: reader.consumeTerminatedText(),
            startTimeMs: reader.consumeNumber({size: 4}),
            endTimeMs: reader.consumeNumber({size: 4}),
            ...consumeOffset("startOffsetBytes"),
            ...consumeOffset("endOffsetBytes"),
            tags: getTags(
                { buffer: reader.consumePossiblyEmptyBuffer(), version }
            ) as Tags
        }
    }
}
