import iconv = require('iconv-lite')
import { isString } from "./util"

export function stringToEncodedBuffer(
    value: string,
    encodingByte: string | number
) {
    return iconv.encode(
        value,
        encodingFromStringOrByte(encodingByte)
    )
}

export function bufferToDecodedString(
    buffer: Buffer,
    encodingByte: string | number
) {
    return iconv.decode(
        buffer,
        encodingFromStringOrByte(encodingByte)
    ).replace(/\0/g, '')
}

function encodingFromStringOrByte(encoding: string | number) {
    const ENCODINGS = [
        'ISO-8859-1', 'UTF-16', 'UTF-16BE', 'UTF-8'
    ]

    if (isString(encoding) && ENCODINGS.includes(encoding)) {
        return encoding
    }
    if (
        typeof encoding === "number" &&
        encoding >= 0 && encoding < ENCODINGS.length
    ) {
        return ENCODINGS[encoding]
    }
    return ENCODINGS[0]
}

