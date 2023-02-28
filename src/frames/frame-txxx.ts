import { FrameBuilder } from "../FrameBuilder"
import { FrameReader } from "../FrameReader"
import type { Data } from "./type"

export const TXXX = {
    create: (data: Data) => {
        if(!(data instanceof Array)) {
            data = [data]
        }

        return Buffer.concat(data.map((udt: Data) => new FrameBuilder("TXXX")
            .appendNumber(0x01, 1)
            .appendNullTerminatedValue(udt.description, 0x01)
            .appendValue(udt.value, null, 0x01)
            .getBuffer()))
    },
    read: (buffer: Buffer) => {
        const reader = new FrameReader(buffer, 0)

        return {
            description: reader.consumeNullTerminatedValue('string'),
            value: reader.consumeStaticValue('string')
        }
    }
}
