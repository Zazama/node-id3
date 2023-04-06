import { TextEncoding } from "../definitions/Encoding"
import { FrameBuilder } from "../FrameBuilder"
import { FrameReader } from "../FrameReader"
import { UserDefinedText } from "../types/TagFrames"

export const TXXX = {
    create: (udt: UserDefinedText): Buffer => {
        return new FrameBuilder("TXXX", TextEncoding.UTF_16_WITH_BOM)
            .appendTerminatedTextWithFrameEncoding(udt.description ?? "")
            .appendTextWithFrameEncoding(udt.value)
            .getBufferWithPartialHeader()
    },
    read: (buffer: Buffer): UserDefinedText => {
        const reader = new FrameReader(buffer, {consumeEncodingByte: true})
        return {
            description: reader.consumeTerminatedTextWithFrameEncoding(),
            value: reader.consumeTextWithFrameEncoding()
        }
    }
}
