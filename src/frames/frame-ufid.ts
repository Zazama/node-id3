import { FrameBuilder } from "../FrameBuilder"
import { FrameReader } from "../FrameReader"
import { UniqueFileIdentifier } from "../types/TagFrames"

export const UFID = {
    create: (ufid: UniqueFileIdentifier): Buffer => {
        return new FrameBuilder("UFID")
            .appendTerminatedText(ufid.ownerIdentifier)
            .appendBuffer(
                ufid.identifier instanceof Buffer ?
                ufid.identifier : Buffer.from(ufid.identifier, "utf8")
            )
            .getBufferWithPartialHeader()
    },
    read: (buffer: Buffer): UniqueFileIdentifier => {
        const reader = new FrameReader(buffer)
        return {
            ownerIdentifier: reader.consumeTerminatedText(),
            identifier: reader.consumePossiblyEmptyBuffer()
        }
    }
}
