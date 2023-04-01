import { TextEncoding } from "../definitions/Encoding"
import { FrameBuilder } from "../FrameBuilder"
import { FrameReader } from "../FrameReader"
import { Comment } from "../types/TagFrames"
import { validateLanguage } from "./util"

export const COMM = {
    create: (data: Comment): Buffer => {
        if(data.text == undefined) {
            throw new TypeError("Missing text from 'Comment' frame")
        }
        const textEncoding = TextEncoding.UTF_16_WITH_BOM
        return new FrameBuilder("COMM")
            .appendNumber(textEncoding, 1)
            .appendValue(validateLanguage(data.language))
            .appendNullTerminatedValue(data.shortText, textEncoding)
            .appendValue(data.text, null, textEncoding)
            .getBufferWithPartialHeader()
    },
    read: (buffer: Buffer): Comment => {
        const reader = new FrameReader(buffer, {consumeEncodingByte: true})
        return {
            language: reader.consumeText({size: 3}),
            shortText: reader.consumeTerminatedTextWithFrameEncoding(),
            text: reader.consumeTextWithFrameEncoding()
        }
    }
}
