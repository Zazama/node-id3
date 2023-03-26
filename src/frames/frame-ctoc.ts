import { FrameBuilder } from "../FrameBuilder"
import { FrameReader } from "../FrameReader"
import * as TagsHelpers from '../TagsHelpers'
import { TableOfContents } from "../types/TagFrames"
import { Tags, WriteTags } from "../types/Tags"

const FLAGS = {
    TOP_LEVEL: 2,
    ORDERED: 1
} as const

export const CTOC = {
    create: (toc: TableOfContents<WriteTags>, index: number) => {
        if (!toc.elementID) {
            throw new TypeError("An elementID must be provided")
        }
        const flags =
            (index === 0 ? FLAGS.TOP_LEVEL : 0) |
            (toc.isOrdered ? FLAGS.ORDERED : 0)

        const { elements = [] } = toc

        const builder = new FrameBuilder("CTOC")
            .appendNullTerminatedValue(toc.elementID)
            .appendValue(flags, 1)
            .appendNumber(elements.length, 1)

        elements.forEach((element) => {
            builder.appendNullTerminatedValue(element)
        })
        if (toc.tags) {
            builder.appendValue(TagsHelpers.createBufferFromTags(toc.tags))
        }
        return builder.getBuffer()
    },
    read: (buffer: Buffer): TableOfContents<Tags> => {
        const reader = new FrameReader(buffer)

        const elementID = reader.consumeNullTerminatedValue('string')
        const flags = reader.consumeStaticValue('number', 1)
        const entries = reader.consumeStaticValue('number', 1)
        const elements = []
        for(let i = 0; i < entries; i++) {
            elements.push(reader.consumeNullTerminatedValue('string'))
        }
        const tags =
            TagsHelpers.getTagsFromTagBody(reader.consumeStaticValue()) as Tags

        return {
            elementID,
            isOrdered: !!(flags & FLAGS.ORDERED),
            elements,
            tags
        }
    }
}
