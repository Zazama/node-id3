import { SplitBuffer, } from "./ID3Util"
import * as ID3Util from "./ID3Util"

type DataType = "string" | "number"

export class ID3FrameReader {
    private _encoding: number
    private _splitBuffer: SplitBuffer

    constructor(
        buffer: Buffer,
        encodingBytePosition: number,
        consumeEncodingByte = true
    ) {
        if (!buffer || !(buffer instanceof Buffer)) {
            buffer = Buffer.alloc(0)
        }
        if (Number.isInteger(encodingBytePosition)) {
            this._encoding = buffer[encodingBytePosition] ? buffer[encodingBytePosition] : 0x00
            if (consumeEncodingByte) {
                buffer = encodingBytePosition === 0 ?
                    buffer.subarray(1) :
                    Buffer.concat([
                        buffer.subarray(0, encodingBytePosition),
                        buffer.subarray(encodingBytePosition)
                    ])
            }
        } else {
            this._encoding = 0x00
        }
        this._splitBuffer = new SplitBuffer(null, buffer.subarray(0))
    }

    consumeStaticValue(
        dataType: DataType,
        size: number,
        encoding = this._encoding
    ) {
        return this._consumeByFunction(
            // TODO check if this._splitBuffer.remainder can be null!
            // eslint-disable-next-line
            () => staticValueFromBuffer(this._splitBuffer.remainder!, size),
            dataType,
            encoding
        )
    }

    consumeNullTerminatedValue(
        dataType: DataType,
        encoding = this._encoding
    ) {
        return this._consumeByFunction(
            // TODO check if this._splitBuffer.remainder can be null!
            // eslint-disable-next-line
            () => nullTerminatedValueFromBuffer(this._splitBuffer.remainder!, encoding),
            dataType,
            encoding
        )
    }

    private _consumeByFunction(
        fn: () => SplitBuffer,
        dataType: DataType,
        encoding: number
    ) {
        if (
            !this._splitBuffer.remainder ||
            this._splitBuffer.remainder.length === 0
        ) {
            return undefined
        }
        this._splitBuffer = fn()
        if (dataType) {
            return convertValue(this._splitBuffer.value, dataType, encoding)
        }
        return this._splitBuffer.value
    }
}

function convertValue(
    buffer: Buffer | number | string | null,
    dataType: DataType,
    encoding = 0x00
) {
    if (!buffer) {
        return undefined
    }
    if (!(buffer instanceof Buffer)) {
        return buffer
    }
    if (buffer.length === 0) {
        return undefined
    }
    if (dataType === "number") {
        return parseInt(buffer.toString('hex'), 16)
    }
    if (dataType === "string") {
        return ID3Util.bufferToDecodedString(buffer, encoding)
    }
    return buffer
}

function staticValueFromBuffer(
    buffer: Buffer,
    size: number
): SplitBuffer {
    size = size ?? buffer.length
    if (buffer.length > size) {
        return new SplitBuffer(
            buffer.subarray(0, size), buffer.subarray(size)
        )
    }
    return new SplitBuffer(buffer.subarray(0), null)
}

function nullTerminatedValueFromBuffer(
    buffer: Buffer,
    encoding = 0x00
): SplitBuffer {
    return ID3Util.splitNullTerminatedBuffer(buffer, encoding)
}
