import { TextEncoding } from "../definitions/Encoding"
import { FrameBuilder } from "../FrameBuilder"
import { FrameReader } from "../FrameReader"
import { UnsynchronisedLyrics } from "../types/TagFrames"
import { isString } from '../util'

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
        if (data.language.length !== 3) {
            throw new TypeError(
                "Language string length must be 3, see ISO 639-2 codes"
            )
        }

        const textEncoding = TextEncoding.UTF_16_WITH_BOM
        return new FrameBuilder("USLT")
            .appendNumber(textEncoding, 1)
            .appendValue(data.language, TextEncoding.ISO_8859_1)
            .appendNullTerminatedValue(data.shortText, textEncoding)
            .appendValue(data.text, null, textEncoding)
            .getBuffer()
    },
    read: (buffer: Buffer): UnsynchronisedLyrics => {
        const reader = new FrameReader(buffer, 0)
        return {
            language: reader.consumeStaticValue(
                'string', 3, TextEncoding.ISO_8859_1
            ),
            shortText: reader.consumeNullTerminatedValue('string'),
            text: reader.consumeStaticValue('string', null)
        }
    }
}
