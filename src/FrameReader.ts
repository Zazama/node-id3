import { TextEncoding } from "./definitions/Encoding"
import { bufferToDecodedString } from "./util-text-encoding"

type FrameReaderOptions = {
    consumeEncodingByte?: boolean
}

type Size = {
    size?: number
}

export class FrameReader {
    private _encoding: TextEncoding = TextEncoding.ISO_8859_1
    private _buffer: Buffer

    constructor(
        buffer: Buffer,
        {
            consumeEncodingByte = false
        }: FrameReaderOptions = {}
    ) {
        this._buffer = buffer
        if (consumeEncodingByte) {
            const encoding = this.consumeBuffer({ size: 1 })
            this._encoding = encoding[0] as TextEncoding
        }
    }

    isBufferEmpty() {
        return this._buffer.length === 0
    }

    consumePossiblyEmptyBuffer(
        { size = this._buffer.length }: Size = {}
    ): Buffer {
        if (size > this._buffer.length) {
            throw new RangeError(
                `Requested size ${size} larger than the buffer size ${this._buffer.length}`
            )
        }
        const consumed = this._buffer.subarray(0, size)
        this._buffer = this._buffer.subarray(size)
        return consumed
    }

    consumeBuffer(size?: Size): Buffer {
        if (this._buffer.length === 0) {
            throw new RangeError("Buffer empty")
        }
        return this.consumePossiblyEmptyBuffer(size)
    }

    consumeNumber({ size }: { size: number }): number {
        const buffer = this.consumeBuffer({ size })
        return parseInt(buffer.toString('hex'), 16)
    }

    consumeText({ size, encoding = TextEncoding.ISO_8859_1 }: {
        size?: number
        encoding?: TextEncoding
    } = {}): string {
        const buffer = this.consumeBuffer({ size })
        return bufferToDecodedString(buffer, encoding)
    }

    consumeTextWithFrameEncoding(size: Size = {}): string {
        return this.consumeText({...size, encoding: this._encoding})
    }

    consumeTerminatedText(
        encoding: TextEncoding = TextEncoding.ISO_8859_1
    ): string {
        const [consumed, remainder] =
            splitNullTerminatedBuffer(this._buffer, encoding)
        this._buffer = remainder
        return bufferToDecodedString(consumed, encoding)
    }

    consumeTerminatedTextWithFrameEncoding(): string {
        return this.consumeTerminatedText(this._encoding)
    }
}

/**
 * @param buffer A buffer starting with a null-terminated text string.
 * @param encoding The encoding type in which the text string is encoded.
 * @returns A split buffer containing the bytes before and after the null
 *          termination. If no null termination is found, considers that
 *          the buffer was not containing a text string and returns
 *          the given buffer as the remainder in the split buffer.
 */
export function splitNullTerminatedBuffer(
    buffer: Buffer,
    encoding: TextEncoding
) {
    const charSize = ([
        TextEncoding.UTF_16_WITH_BOM,
        TextEncoding.UTF_16_BE
    ] as number[]).includes(encoding) ? 2 : 1

    for (let pos = 0; pos <= buffer.length - charSize; pos += charSize) {
        if (buffer.readUIntBE(pos, charSize) === 0) {
            return [
                buffer.subarray(0, pos),
                buffer.subarray(pos + charSize)
            ] as const
        }
    }
    throw new RangeError("Terminating character not found")
}
