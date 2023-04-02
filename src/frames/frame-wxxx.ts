import { TextEncoding } from "../definitions/Encoding"
import { FrameBuilder } from "../FrameBuilder"
import { FrameReader } from "../FrameReader"
import { UserDefinedUrl } from "../types/TagFrames"

export const WXXX = {
    create: (data: UserDefinedUrl) => {
        const textEncoding = TextEncoding.UTF_16_WITH_BOM
        return new FrameBuilder("WXXX")
            .appendNumber(textEncoding, 1)
            .appendNullTerminatedValue(data.description, textEncoding)
            .appendValue(data.url, null, TextEncoding.ISO_8859_1)
            .getBufferWithPartialHeader()
    },
    read: (buffer: Buffer): UserDefinedUrl => {
        const reader = new FrameReader(buffer, {consumeEncodingByte: true})
        return {
            description: reader.consumeTerminatedTextWithFrameEncoding(),
            url: reader.consumeText()
        }
    }
}
