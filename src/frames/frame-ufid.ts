import { FrameBuilder } from "../FrameBuilder"
import { FrameReader } from "../FrameReader"
import type { Data } from "./type"

export const UFID = {
    create: (data: Data) => {
        if (!(data instanceof Array)) {
            data = [data]
        }

        return Buffer.concat(data.map((ufid: Data) => new FrameBuilder("UFID")
            .appendNullTerminatedValue(ufid.ownerIdentifier)
            .appendValue(
                ufid.identifier instanceof Buffer ?
                ufid.identifier : Buffer.from(ufid.identifier, "utf8")
            )
            .getBuffer()))
    },
    read: (buffer: Buffer) => {
        const reader = new FrameReader(buffer)
        return {
            ownerIdentifier: reader.consumeNullTerminatedValue('string'),
            identifier: reader.consumeStaticValue()
        }
    }
}