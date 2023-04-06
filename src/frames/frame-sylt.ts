import { TextEncoding } from "../definitions/Encoding"
import { FrameBuilder } from "../FrameBuilder"
import { FrameReader } from "../FrameReader"
import { SynchronisedLyrics } from "../types/TagFrames"
import { validateLanguageCode } from "./util"

type TimeStampFormat = SynchronisedLyrics["timeStampFormat"]

export const SYLT = {
    create: (lyrics: SynchronisedLyrics): Buffer => {
        return new FrameBuilder("SYLT", TextEncoding.UTF_16_WITH_BOM)
            .appendText(validateLanguageCode(lyrics.language))
            .appendNumber(lyrics.timeStampFormat, {size: 1})
            .appendNumber(lyrics.contentType, {size: 1})
            .appendTerminatedTextWithFrameEncoding(lyrics.shortText ?? "")
            .appendArray(lyrics.synchronisedText, (builder, part) => builder
                .appendTerminatedTextWithFrameEncoding(part.text)
                .appendNumber(part.timeStamp, {size: 4})
            )
            .getBufferWithPartialHeader()
    },
    read: (buffer: Buffer): SynchronisedLyrics => {
        const reader = new FrameReader(buffer, {consumeEncodingByte: true})
        return {
            language: reader.consumeText({ size: 3}),
            timeStampFormat: reader.consumeNumber({size: 1}) as TimeStampFormat,
            contentType: reader.consumeNumber({size: 1}),
            shortText: reader.consumeTerminatedTextWithFrameEncoding(),
            synchronisedText: Array.from((function*() {
                while(!reader.isBufferEmpty()) {
                    yield {
                        text: reader.consumeTerminatedTextWithFrameEncoding(),
                        timeStamp: reader.consumeNumber({size: 4})
                    }
                }
            })())
        }
    }
}
