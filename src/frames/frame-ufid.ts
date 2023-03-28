import { FrameBuilder } from "../FrameBuilder"
import { FrameReader } from "../FrameReader"
import { UniqueFileIdentifier } from "../types/TagFrames"

export const UFID = {
    create: (ufid: UniqueFileIdentifier): Buffer => {
        return new FrameBuilder("UFID")
            .appendNullTerminatedValue(ufid.ownerIdentifier)
            .appendValue(
                ufid.identifier instanceof Buffer ?
                ufid.identifier : Buffer.from(ufid.identifier, "utf8")
            )
            .getBuffer()
    },
    read: (buffer: Buffer): UniqueFileIdentifier => {
        const reader = new FrameReader(buffer)
        return {
            ownerIdentifier: reader.consumeNullTerminatedValue('string'),
            identifier: reader.consumeStaticValue()
        }
    }
}
