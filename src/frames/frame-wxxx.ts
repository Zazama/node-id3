import { FrameBuilder } from "../FrameBuilder"
import { FrameReader } from "../FrameReader"
import type { Data } from "./type"

export const WXXX = {
    create: (data: Data) => {
        return new FrameBuilder("WXXX")
            .appendNumber(0x01, 1)
            .appendNullTerminatedValue(data.description, 0x01)
            .appendValue(data.url, null)
            .getBuffer()
    },
    read: (buffer: Buffer) => {
        const reader = new FrameReader(buffer, 0)

        return {
            description: reader.consumeNullTerminatedValue('string'),
            url: reader.consumeStaticValue('string', null, 0x00)
        }
    }
}
