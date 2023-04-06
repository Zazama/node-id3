import { TextEncoding } from "../definitions/Encoding"
import { FrameBuilder } from "../FrameBuilder"
import { FrameReader } from "../FrameReader"
import { UserDefinedUrl } from "../types/TagFrames"

export const WXXX = {
    create: (data: UserDefinedUrl): Buffer => {
        return new FrameBuilder("WXXX", TextEncoding.UTF_16_WITH_BOM)
            .appendTerminatedTextWithFrameEncoding(data.description)
            .appendText(data.url)
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
