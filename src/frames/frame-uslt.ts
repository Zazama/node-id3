import { TextEncoding } from "../definitions/Encoding"
import { FrameBuilder } from "../FrameBuilder"
import { FrameReader } from "../FrameReader"
import { UnsynchronisedLyrics } from "../types/TagFrames"
import { isString } from '../util'
import { validateLanguageCode } from "./util"

export const USLT = {
    create: (data: UnsynchronisedLyrics | string) => {
        if(isString(data)) {
            // TODO: we should probably not accept a string only,
            // as the language is not optionalm default to eng for now.
            data = {
                language: 'eng',
                text: data
            }
        }
        if(!data.text) {
            return null
        }

        return new FrameBuilder("USLT", TextEncoding.UTF_16_WITH_BOM)
            .appendText(validateLanguageCode(data.language))
            .appendTerminatedTextWithFrameEncoding(data.shortText ?? "")
            .appendTextWithFrameEncoding(data.text)
            .getBufferWithPartialHeader()
    },
    read: (buffer: Buffer): UnsynchronisedLyrics => {
        const reader = new FrameReader(buffer, {consumeEncodingByte: true})
        return {
            language: reader.consumeText({ size: 3}),
            shortText: reader.consumeTerminatedTextWithFrameEncoding(),
            text: reader.consumeTextWithFrameEncoding()
        }
    }
}
