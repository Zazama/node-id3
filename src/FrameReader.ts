import { SplitBuffer, } from "./ID3Util"
import * as ID3Util from "./ID3Util"
import { TextEncoding } from "./definitions/Encoding"

type DataType = "string" | "number" | "buffer"

type FrameReaderOptions = {
    consumeEncodingByte?: boolean
}

export class FrameReader {
    private _encoding: number
    private _splitBuffer: SplitBuffer

    constructor(
        buffer: Buffer,
        {
            consumeEncodingByte = false
        }: FrameReaderOptions = {}
    ) {
        if (consumeEncodingByte) {
            const encodingBytePosition = 0
            this._encoding =
                buffer[encodingBytePosition] ?? TextEncoding.ISO_8859_1
            if (consumeEncodingByte) {
                buffer = encodingBytePosition === 0 ?
                    buffer.subarray(1) :
                    Buffer.concat([
                        buffer.subarray(0, encodingBytePosition),
                        buffer.subarray(encodingBytePosition)
                    ])
            }
        } else {
            this._encoding = TextEncoding.ISO_8859_1
        }
        this._splitBuffer = new SplitBuffer(null, buffer.subarray(0))
    }

    consumeStaticValue(
        dataType: 'string',
        size?: number | null,
        encoding?: number
    ): string
    consumeStaticValue(
        dataType: 'number',
        size?: number | null,
        encoding?: number
    ): number
    consumeStaticValue(
        dataType: 'buffer',
        size?: number | null,
        encoding?: number
    ): Buffer
    consumeStaticValue(
    ): Buffer
    consumeStaticValue(
        dataType: DataType = 'buffer',
        size?: number | null,
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
        dataType: 'string',
        encoding?: number
     ): string
     consumeNullTerminatedValue(
        dataType: 'number',
        encoding?: number
     ): number
    consumeNullTerminatedValue(
        dataType: DataType,
        encoding = this._encoding
    ) {
        return this._consumeByFunction(
            () => ID3Util.splitNullTerminatedBuffer(
                // TODO check if this._splitBuffer.remainder can be null!
                // eslint-disable-next-line
                this._splitBuffer.remainder!,
                encoding
            ),
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
    // TODO: Check this behaviour:
    // - if 0 or an empty string is given it will return `undefined`
    //   I don't think this should behave that way.
    //   I would think this test should not exist, the following one
    //   !(buffer instanceof Buffer)) should be sufficient and more correct,
    //   removing this test would:
    //   - return 0 if 0 is given (instead of undefined)
    //   - return "" if "" is given (instead of undefined)
    //   - return null if null is given (instead of undefined)
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
    size?: number | null
): SplitBuffer {
    size = size ?? buffer.length
    if (buffer.length > size) {
        return new SplitBuffer(
            buffer.subarray(0, size), buffer.subarray(size)
        )
    }
    return new SplitBuffer(buffer.subarray(0), null)
}
