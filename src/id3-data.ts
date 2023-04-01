import { encodeSize } from "./ID3Util"

export function createId3Data(frames: Buffer) {
    const header = Buffer.alloc(10)
    header.fill(0)
    header.write("ID3", 0)              // File identifier
    header.writeUInt16BE(0x0300, 3)     // Version 2.3.0  --  03 00
    header.writeUInt16BE(0x0000, 5)     // Flags 00
    encodeSize(frames.length).copy(header, 6)

    return Buffer.concat([header, frames])
}
