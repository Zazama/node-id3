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
        return new FrameBuilder("COMM", TextEncoding.UTF_16_WITH_BOM)
            .appendText(validateLanguage(data.language))
            .appendTerminatedTextWithFrameEncoding(data.shortText ?? "")
            .appendTerminatedTextWithFrameEncoding(data.text)
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
