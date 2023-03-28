import { TextEncoding } from "../definitions/Encoding"
import { FrameBuilder } from "../FrameBuilder"
import { FrameReader } from "../FrameReader"
import { UserDefinedText } from "../types/TagFrames"

export const TXXX = {
    create: (udt: UserDefinedText) => {
        const textEncoding = TextEncoding.UTF_16_WITH_BOM
        return new FrameBuilder("TXXX")
            .appendNumber(textEncoding, 1)
            .appendNullTerminatedValue(udt.description, textEncoding)
            .appendValue(udt.value, null, textEncoding)
            .getBuffer()
    },
    read: (buffer: Buffer): UserDefinedText => {
        const reader = new FrameReader(buffer, {consumeEncodingByte: true})
        return {
            description: reader.consumeTerminatedTextWithFrameEncoding(),
            value: reader.consumeTextWithFrameEncoding()
        }
    }
}
