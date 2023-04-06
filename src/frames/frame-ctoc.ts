import { FrameBuilder } from "../FrameBuilder"
import { FrameReader } from "../FrameReader"
import { getTags } from '../frames-reader'
import { buildFramesBuffer } from "../frames-builder"
import { TableOfContents } from "../types/TagFrames"
import { Tags, WriteTags } from "../types/Tags"

const FLAGS = {
    TOP_LEVEL: 2,
    ORDERED: 1
} as const

export const CTOC = {
    create: (toc: TableOfContents<WriteTags>, index: number): Buffer => {
        if (toc.elementID == undefined) {
            throw new TypeError("An elementID must be provided")
        }
        const flags =
            (index === 0 ? FLAGS.TOP_LEVEL : 0) |
            (toc.isOrdered ? FLAGS.ORDERED : 0)

        const { elements = [] } = toc

        return new FrameBuilder("CTOC")
            .appendTerminatedText(toc.elementID)
            .appendNumber(flags, {size: 1})
            .appendNumber(elements.length, {size: 1})
            .appendArray(elements, (builder, elementId) => builder
                .appendTerminatedText(elementId)
            )
            .appendBuffer(buildFramesBuffer(toc.tags))
            .getBufferWithPartialHeader()
    },
    read: (buffer: Buffer, version: number): TableOfContents<Tags> => {
        const reader = new FrameReader(buffer)

        const elementID = reader.consumeTerminatedText()
        const flags = reader.consumeNumber({size: 1})

        const entries = reader.consumeNumber({size: 1})
        const elements = []
        for(let i = 0; i < entries; i++) {
            elements.push(reader.consumeTerminatedText())
        }
        const tags = getTags(
            { buffer: reader.consumePossiblyEmptyBuffer(), version }
        ) as Tags

        return {
            elementID,
            isOrdered: !!(flags & FLAGS.ORDERED),
            elements,
            tags
        }
    }
}
