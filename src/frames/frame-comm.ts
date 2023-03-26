import { TextEncoding } from "../definitions/Encoding"
import { FrameBuilder } from "../FrameBuilder"
import { FrameReader } from "../FrameReader"
import { Comment } from "../types/TagFrames"

export const COMM = {
    create: (data: Comment): Buffer => {
        if(!data.text) {
            throw new TypeError("Missing text from 'Comment' frame")
        }

        const textEncoding = TextEncoding.UTF_16_WITH_BOM
        return new FrameBuilder("COMM")
            .appendNumber(textEncoding, 1)
            .appendValue(data.language)
            .appendNullTerminatedValue(data.shortText, textEncoding)
            .appendValue(data.text, null, textEncoding)
            .getBuffer()
    },
    read: (buffer: Buffer): Comment => {
        const reader = new FrameReader(buffer, 0)
        return {
            language: reader.consumeStaticValue('string', 3, TextEncoding.ISO_8859_1),
            shortText: reader.consumeNullTerminatedValue('string'),
            text: reader.consumeStaticValue('string', null)
        }
    }
}
