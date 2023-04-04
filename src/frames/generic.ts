import { FrameBuilder } from "../FrameBuilder"
import { FrameReader } from "../FrameReader"
import { TextEncoding } from "../definitions/Encoding"

export const GENERIC_TEXT = {
    create: (frameIdentifier: string, text: string): Buffer | null => {
        if(!frameIdentifier || text == undefined) {
            return null
        }
        return new FrameBuilder(frameIdentifier, TextEncoding.UTF_16_WITH_BOM)
            .appendTextWithFrameEncoding(text)
            .getBufferWithPartialHeader()
    },
    read: (buffer: Buffer) => {
        const reader = new FrameReader(buffer, {consumeEncodingByte: true})
        return reader.consumeTextWithFrameEncoding()
    }
}

export const GENERIC_URL = {
    create: (frameIdentifier: string, url: string) => {
        if(!frameIdentifier || url == undefined) {
            return null
        }
        return new FrameBuilder(frameIdentifier)
            .appendText(url)
            .getBufferWithPartialHeader()
    },
    read: (buffer: Buffer) => {
        const reader = new FrameReader(buffer)
        return reader.consumeText()
    }
}
