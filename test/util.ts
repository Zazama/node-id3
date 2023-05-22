
export function createTestBuffer(length: number): Buffer {
    return Buffer.from(Array.from({ length }, (_, index) => index % 256))
}
