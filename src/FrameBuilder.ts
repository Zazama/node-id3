import * as ID3Util from "./ID3Util"
import { isString } from "./util"
import { TextEncoding } from "./definitions/Encoding"

type Value = Buffer | number | string

export class FrameBuilder {
    private identifier: string
    private buffer = Buffer.alloc(0)

    constructor(identifier: string) {
        this.identifier = identifier
    }

    appendValue(
        value: Value,
        size?: number | null,
        encoding: TextEncoding = TextEncoding.ISO_8859_1
    ) {
        const convertedValue = convertValue(value, encoding)
        this.appendBuffer(staticValueToBuffer(convertedValue, size))
        return this
    }

    appendNumber(value: number, size: number) {
        if (Number.isInteger(value)) {
            let hexValue = value.toString(16)
            if (hexValue.length % 2 !== 0) {
                hexValue = "0" + hexValue
            }
            this.appendBuffer(
                staticValueToBuffer(Buffer.from(hexValue, 'hex'), size)
            )
        }
        return this
    }

    appendNullTerminatedValue(value = '', encoding: TextEncoding = TextEncoding.ISO_8859_1) {
        this.appendBuffer(
            convertValue(value, encoding),
            getTerminatingMarker(encoding)
        )
        return this
    }

    getBuffer() {
        const header = Buffer.alloc(10)
        header.write(this.identifier, 0)
        header.writeUInt32BE(this.buffer.length, 4)
        return Buffer.concat([header, this.buffer])
    }

    private appendBuffer(...buffers: Buffer[]) {
        this.buffer = Buffer.concat([this.buffer, ...buffers])
    }
}

function convertValue(
    value: Value,
    encoding: TextEncoding = TextEncoding.ISO_8859_1
) {
    if (value instanceof Buffer) {
        return value
    }
    if (Number.isInteger(value) || isString(value)) {
        return ID3Util.stringToEncodedBuffer(value.toString(), encoding)
    }
    return Buffer.alloc(0)
}

function staticValueToBuffer(buffer: Buffer, size?: number | null) {
    if (size && buffer.length < size) {
        return Buffer.concat([Buffer.alloc(size - buffer.length, 0x00), buffer])
    }
    return buffer
}

function getTerminatingMarker(encoding: TextEncoding) {
    if (encoding === TextEncoding.UTF_16_WITH_BOM ||
        encoding === TextEncoding.UTF_16_BE
    ) {
        return Buffer.alloc(2, 0x00)
    }
    return Buffer.alloc(1, 0x00)
}

