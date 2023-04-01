import { FrameBuilder } from "../FrameBuilder"
import { FrameReader } from "../FrameReader"
import { Private } from "../types/TagFrames"
import { isBuffer } from "../util"

export const PRIV = {
    create: (priv: Private): Buffer => {
        return new FrameBuilder("PRIV")
            .appendNullTerminatedValue(priv.ownerIdentifier)
            .appendValue(isBuffer(priv.data) ? priv.data : Buffer.from(priv.data, "utf8"))
            .getBufferWithPartialHeader()
    },
    read: (buffer: Buffer): Private => {
        const reader = new FrameReader(buffer)
        return {
            ownerIdentifier: reader.consumeTerminatedText(),
            data: reader.consumePossiblyEmptyBuffer()
        }
    }
}
