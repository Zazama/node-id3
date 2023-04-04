import { TextEncoding } from "./definitions/Encoding"
import { stringToEncodedBuffer } from "./util-text-encoding"

type Size = { size: number }

export class FrameBuilder {
    private identifier: string
    private encoding: TextEncoding = TextEncoding.ISO_8859_1
    private buffer = Buffer.alloc(0)

    constructor(
        identifier: string,
        encoding?: TextEncoding
    ) {
        this.identifier = identifier
        if (encoding !== undefined) {
            this.encoding = encoding
            this.appendNumber(encoding, {size: 1})
        }
    }

    appendBuffer(buffer: Buffer) {
        this.buffer = Buffer.concat([this.buffer, buffer])
        return this
    }

    appendNumber(value: number, {size}: Size) {
        if (!Number.isInteger(value)) {
            throw new RangeError("An integer value is expected")
        }
        let hexValue = value.toString(16)
        if (hexValue.length % 2 !== 0) {
            hexValue = "0" + hexValue
        }
        const valueBuffer = Buffer.from(hexValue, 'hex')
        const zeroPad = Buffer.alloc(size - valueBuffer.length)
        return this.appendBuffer(
            Buffer.concat([zeroPad, valueBuffer]).subarray(0, size)
        )
    }

    appendText(text: string, encoding: TextEncoding = TextEncoding.ISO_8859_1) {
        // TODO remove the .toString() for new API release
        return this.appendBuffer(
            stringToEncodedBuffer(text.toString(), encoding)
        )
    }

    appendTextWithFrameEncoding(text: string) {
        return this.appendText(text, this.encoding)
    }

    appendTerminatedText(
        text: string,
        encoding: TextEncoding = TextEncoding.ISO_8859_1
    ) {
        // TODO remove the .toString() for new API release
        return this.appendText(text.toString() + "\0", encoding)
    }

    appendTerminatedTextWithFrameEncoding(text: string) {
        return this.appendTerminatedText(text, this.encoding)
    }

    appendArray<T>(
        values: T[],
        callback: (builder: FrameBuilder, value: T) => void
    ) {
        values.forEach(value => callback(this, value))
        return this
    }

    getBuffer() {
        return this.buffer
    }

    getBufferWithPartialHeader() {
        const header = Buffer.alloc(10)
        header.write(this.identifier, 0)
        header.writeUInt32BE(this.buffer.length, 4)
        return Buffer.concat([header, this.buffer])
    }

}
