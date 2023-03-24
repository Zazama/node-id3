import { FrameBuilder } from "../FrameBuilder"
import { FrameReader } from "../FrameReader"
import { TextEncoding } from "../definitions/Encoding"
import type { Data } from "./type"

export const GENERIC_TEXT = {
    create: (frameIdentifier: string, data: Data) => {
        if(!frameIdentifier || !data) {
            return null
        }

        return new FrameBuilder(frameIdentifier)
            .appendNumber(0x01, 0x01)
            .appendValue(data, null, TextEncoding.UTF_16_WITH_BOM)
            .getBuffer()
    },
    read: (buffer: Buffer) => {
        const reader = new FrameReader(buffer, 0)

        return reader.consumeStaticValue('string')
    }
}

export const GENERIC_URL = {
    create: (frameIdentifier: string, data: string) => {
        if(!frameIdentifier || !data) {
            return null
        }

        return new FrameBuilder(frameIdentifier)
            .appendValue(data)
            .getBuffer()
    },
    read: (buffer: Buffer) => {
        const reader = new FrameReader(buffer)

        return reader.consumeStaticValue('string')
    }
}
