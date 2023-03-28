import { TextEncoding } from "../definitions/Encoding"
import { FrameBuilder } from "../FrameBuilder"
import { FrameReader } from "../FrameReader"
import { UnsynchronisedLyrics } from "../types/TagFrames"
import { isString } from '../util'
import { validateLanguage } from "./util"

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

        const textEncoding = TextEncoding.UTF_16_WITH_BOM
        return new FrameBuilder("USLT")
            .appendNumber(textEncoding, 1)
            .appendValue(validateLanguage(data.language), 3, TextEncoding.ISO_8859_1)
            .appendNullTerminatedValue(data.shortText, textEncoding)
            .appendValue(data.text, null, textEncoding)
            .getBuffer()
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
