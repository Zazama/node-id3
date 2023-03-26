import { TextEncoding } from "../definitions/Encoding"
import { FrameBuilder } from "../FrameBuilder"
import { FrameReader } from "../FrameReader"
import { SynchronisedLyrics } from "../types/TagFrames"
import { validateLanguage } from "./util"

export const SYLT = {
    create: (lyrics: SynchronisedLyrics): Buffer => {
        const textEncoding = TextEncoding.UTF_16_WITH_BOM
        const frameBuilder = new FrameBuilder("SYLT")
            .appendNumber(textEncoding, 1)
            .appendValue(validateLanguage(lyrics.language), 3)
            .appendNumber(lyrics.timeStampFormat, 1)
            .appendNumber(lyrics.contentType, 1)
            .appendNullTerminatedValue(lyrics.shortText, textEncoding)
        lyrics.synchronisedText.forEach(part => {
            frameBuilder.appendNullTerminatedValue(part.text, textEncoding)
            frameBuilder.appendNumber(part.timeStamp, 4)
        })
        return frameBuilder.getBuffer()
    },
    read: (buffer: Buffer): SynchronisedLyrics => {
        const reader = new FrameReader(buffer, {consumeEncodingByte: true})
        return {
            language: reader.consumeString({ size: 3, encoding: TextEncoding.ISO_8859_1 }),
            timeStampFormat: reader.consumeStaticValue('number', 1) as
                SynchronisedLyrics["timeStampFormat"],
            contentType: reader.consumeStaticValue('number', 1),
            shortText: reader.consumeNullTerminatedValue('string'),
            synchronisedText: Array.from((function*() {
                while(true) {
                    const text = reader.consumeNullTerminatedValue('string')
                    const timeStamp = reader.consumeStaticValue('number', 4)
                    if (text === undefined || timeStamp === undefined) {
                        break
                    }
                    yield {text, timeStamp}
                }
            })())
        }
    }
}
