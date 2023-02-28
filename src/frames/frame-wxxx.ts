import { FrameBuilder } from "../FrameBuilder"
import { FrameReader } from "../FrameReader"
import type { Data } from "./type"

export const WXXX = {
    create: (data: Data) => {
        if(!(data instanceof Array)) {
            data = [data]
        }

        return Buffer.concat(data.map((udu: Data) => {
            return new FrameBuilder("WXXX")
                .appendNumber(0x01, 1)
                .appendNullTerminatedValue(udu.description, 0x01)
                .appendValue(udu.url, null)
                .getBuffer()
        }))
    },
    read: (buffer: Buffer) => {
        const reader = new FrameReader(buffer, 0)

        return {
            description: reader.consumeNullTerminatedValue('string'),
            url: reader.consumeStaticValue('string', null, 0x00)
        }
    }
}
