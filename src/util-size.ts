
/**
 * ID3 header size uses only 7 bits of a byte, bit shift is needed.
 * @returns Return a Buffer of 4 bytes with the encoded size
 */
export function encodeSize(size: number) {
    const byte_3 = size & 0x7F
    const byte_2 = (size >> 7) & 0x7F
    const byte_1 = (size >> 14) & 0x7F
    const byte_0 = (size >> 21) & 0x7F
    return Buffer.from([byte_0, byte_1, byte_2, byte_3])
}

/**
 * Decode the encoded size from an ID3 header.
 */
export function decodeSize(encodedSize: Buffer) {
    return (
        (encodedSize[0] << 21) +
        (encodedSize[1] << 14) +
        (encodedSize[2] << 7) +
        encodedSize[3]
    )
}

export function getFrameSize(buffer: Buffer, decode: boolean, version: number) {
    const decodeBytes = version > 2 ?
        [buffer[4], buffer[5], buffer[6], buffer[7]] :
        [buffer[3], buffer[4], buffer[5]]
    if (decode) {
        return decodeSize(Buffer.from(decodeBytes))
    }
    return Buffer.from(decodeBytes).readUIntBE(0, decodeBytes.length)
}
