import { FrameBuilder } from "../FrameBuilder"
import { FrameReader } from "../FrameReader"
import { isString } from '../util'
import type { Data } from "./type"

export const USLT = {
    create: (data: Data) => {
        data = data || {}
        if(isString(data)) {
            data = {
                text: data
            }
        }
        if(!data.text) {
            return null
        }

        return new FrameBuilder("USLT")
            .appendNumber(0x01, 1)
            .appendValue(data.language)
            .appendNullTerminatedValue(data.shortText, 0x01)
            .appendValue(data.text, null, 0x01)
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
