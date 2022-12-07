export type TextEncoding = typeof TextEncoding[keyof typeof TextEncoding]

export const TextEncoding = {
    /**
     * Terminated with one zero byte.
     */
    ISO_8859_1: 0,
    /**
     * Unicode encoded in UTF-16 with Byte Order Marker.
     * Terminated with two zero bytes.
     */
    UTF_16_WITH_BOM: 1,
    /**
     * Unicode encoded in UTF-16 Big Endian without Byte Order Marker.
     * Terminated with two zero bytes.
     */
    UTF_16_BE: 2,
    /**
     * Unicode encoded in UTF-8.
     * Terminated with one zero byte.
     */
    UTF_8: 3
} as const