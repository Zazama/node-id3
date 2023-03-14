import { TextEncoding } from "../definitions/Encoding"
import { FrameBuilder } from "../FrameBuilder"
import { FrameReader } from "../FrameReader"
import type { Data } from "./type"

export const SYLT = {
    create: (data: Data) => {
        if(!(data instanceof Array)) {
            data = [data]
        }

        const encoding = TextEncoding.UTF_16_WITH_BOM
        return Buffer.concat(data.map((lycics: Data) => {
            const frameBuilder = new FrameBuilder("SYLT")
                .appendNumber(encoding, 1)
                .appendValue(lycics.language, 3)
                .appendNumber(lycics.timeStampFormat, 1)
                .appendNumber(lycics.contentType, 1)
                .appendNullTerminatedValue(lycics.shortText, encoding)
            lycics.synchronisedText.forEach((part: Data) => {
                frameBuilder.appendNullTerminatedValue(part.text, encoding)
                frameBuilder.appendNumber(part.timeStamp, 4)
            })
            return frameBuilder.getBuffer()
        }))
    },
    read: (buffer: Buffer) => {
        const reader = new FrameReader(buffer, 0)

        return {
            language: reader.consumeStaticValue('string', 3, 0x00),
            timeStampFormat: reader.consumeStaticValue('number', 1),
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
