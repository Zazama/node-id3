import { FrameBuilder } from "../FrameBuilder"
import { FrameReader } from "../FrameReader"
import { TextEncoding } from "../definitions/Encoding"

export const GENERIC_TEXT = {
    create: (frameIdentifier: string, text: string): Buffer | null => {
        if(!frameIdentifier || text == undefined) {
            return null
        }

        const textEncoding = TextEncoding.UTF_16_WITH_BOM
        return new FrameBuilder(frameIdentifier)
            .appendNumber(textEncoding, 1)
            .appendValue(text, null, textEncoding)
            .getBuffer()
    },
    read: (buffer: Buffer) => {
        const reader = new FrameReader(buffer, 0)

        return reader.consumeStaticValue('string')
    }
}

export const GENERIC_URL = {
    create: (frameIdentifier: string, url: string) => {
        if(!frameIdentifier || url == undefined) {
            return null
        }

        return new FrameBuilder(frameIdentifier)
            .appendValue(url)
            .getBuffer()
    },
    read: (buffer: Buffer) => {
        const reader = new FrameReader(buffer)

        return reader.consumeStaticValue('string')
    }
}
