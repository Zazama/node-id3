import { FrameBuilder } from "../FrameBuilder"
import { FrameReader } from "../FrameReader"
import { TextEncoding } from "../definitions/Encoding"

export const GENERIC_TEXT = {
    create: (frameIdentifier: string, text: string): Buffer => {
        if(text == undefined) {
            throw new TypeError(
                `A text must be provided for frame id ${frameIdentifier}`
            )
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
    create: (frameIdentifier: string, url: string): Buffer => {
        if(url == undefined) {
            throw new TypeError(
                `An url must be provided for frame id ${frameIdentifier}`
            )
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
