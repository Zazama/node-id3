import { FrameBuilder } from "../FrameBuilder"
import { FrameReader } from "../FrameReader"
import * as TagsHelpers from '../TagsHelpers'
import type { Data } from "./type"

export const CTOC = {
    create: (data: Data) => {
        if(!(data instanceof Array)) {
            data = [data]
        }

        return Buffer.concat(data.map((toc: Data, index: Data) => {
            if(!toc || !toc.elementID) {
                return null
            }
            if(!(toc.elements instanceof Array)) {
                toc.elements = []
            }

            const ctocFlags = Buffer.alloc(1, 0)
            if(index === 0) {
                ctocFlags[0] += 2
            }
            if(toc.isOrdered) {
                ctocFlags[0] += 1
            }

            const builder = new FrameBuilder("CTOC")
                .appendNullTerminatedValue(toc.elementID)
                .appendValue(ctocFlags, 1)
                .appendNumber(toc.elements.length, 1)
            toc.elements.forEach((el: Data) => {
                builder.appendNullTerminatedValue(el)
            })
            if(toc.tags) {
                builder.appendValue(TagsHelpers.createBufferFromTags(toc.tags))
            }
            return builder.getBuffer()
        }).filter((toc: Data) => toc instanceof Buffer))
    },
    read: (buffer: Buffer) => {
        const reader = new FrameReader(buffer)
        const elementID = reader.consumeNullTerminatedValue('string')
        const flags = reader.consumeStaticValue('number', 1)
        const entries = reader.consumeStaticValue('number', 1)
        const elements = []
        for(let i = 0; i < entries; i++) {
            elements.push(reader.consumeNullTerminatedValue('string'))
        }
        const tags = TagsHelpers.getTagsFromTagBody(reader.consumeStaticValue())

        return {
            elementID,
            isOrdered: !!(flags & 0x01),
            elements,
            tags
        }
    }
}
