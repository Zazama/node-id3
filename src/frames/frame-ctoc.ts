import { FrameBuilder } from "../FrameBuilder"
import { FrameReader } from "../FrameReader"
import * as TagsHelpers from '../TagsHelpers'
import { TableOfContents } from "../types/TagFrames"
import { Tags, WriteTags } from "../types/Tags"

export const CTOC = {
    create: (toc: TableOfContents<WriteTags>, index: number) => {
        if (!toc.elementID) {
            throw new TypeError("An elementID must be provided")
        }
        const { elements = [] } = toc

        const ctocFlags = Buffer.alloc(1, 0)
        if (index === 0) {
            ctocFlags[0] += 2
        }
        if (toc.isOrdered) {
            ctocFlags[0] += 1
        }

        const builder = new FrameBuilder("CTOC")
            .appendNullTerminatedValue(toc.elementID)
            .appendValue(ctocFlags, 1)
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
            isOrdered: !!(flags & 0x01),
            elements,
            tags
        }
    }
}
