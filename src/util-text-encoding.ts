import iconv = require('iconv-lite')
import { TextEncoding } from './definitions/Encoding'

export function stringToEncodedBuffer(
    value: string,
    encoding: TextEncoding
) {
    return iconv.encode(
        value,
        convertTextEncodingToIconEncoding(encoding)
    )
}

export function bufferToDecodedString(
    buffer: Buffer,
    encoding: TextEncoding
) {
    return iconv.decode(
        buffer,
        convertTextEncodingToIconEncoding(encoding)
    ).replace(/\0/g, '')
}

const TO_ICON_ENCODING = {
    [TextEncoding.ISO_8859_1]: 'ISO-8859-1',
    [TextEncoding.UTF_16_WITH_BOM]: 'UTF-16',
    [TextEncoding.UTF_16_BE]: 'UTF-16BE',
    [TextEncoding.UTF_8]: 'UTF-8'
} satisfies Record<TextEncoding, string>

export function validateEncoding(encoding: number): TextEncoding {
    if (encoding in TO_ICON_ENCODING) {
        return encoding as TextEncoding
    }
    throw new RangeError(`Unknown encoding value ${encoding}`)
}

function convertTextEncodingToIconEncoding(encoding: TextEncoding) {
    return TO_ICON_ENCODING[validateEncoding(encoding)]
}

