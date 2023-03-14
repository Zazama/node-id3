import { TextEncoding } from "../definitions/Encoding"
import { FrameBuilder } from "../FrameBuilder"
import { FrameReader } from "../FrameReader"
import { isString } from '../util'
import type { Data } from "./type"

export const USLT = {
    create: (data: Data) => {
        data = data || {}
        if(isString(data)) {
            data = {
                // TODO This is buggy specs expects a language of 3 characters
                text: data
            }
        }
        if(!data.text) {
            return null
        }

        const encoding = TextEncoding.UTF_16_WITH_BOM
        return new FrameBuilder("USLT")
            .appendNumber(0x01, encoding)
            .appendValue(data.language)
            .appendNullTerminatedValue(data.shortText, encoding)
            .appendValue(data.text, null, encoding)
            .getBuffer()
    },
    read: (buffer: Buffer) => {
        const reader = new FrameReader(buffer, 0)

        return {
            language: reader.consumeStaticValue('string', 3, 0x00),
            shortText: reader.consumeNullTerminatedValue('string'),
            text: reader.consumeStaticValue('string', null)
        }
    }
}
