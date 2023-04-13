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

function convertTextEncodingToIconEncoding(encoding: TextEncoding) {
    const toIconvEncoding = {
        [TextEncoding.ISO_8859_1]: 'ISO-8859-1',
        [TextEncoding.UTF_16_WITH_BOM]: 'UTF-16',
        [TextEncoding.UTF_16_BE]: 'UTF-16BE',
        [TextEncoding.UTF_8]: 'UTF-8'
    }
    if (toIconvEncoding[encoding]) {
        return toIconvEncoding[encoding]
    }
    throw new RangeError(`Unknown encoding value ${encoding}, can't decode`)
}

