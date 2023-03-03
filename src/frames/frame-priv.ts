import { FrameBuilder } from "../FrameBuilder"
import { FrameReader } from "../FrameReader"
import type { Data } from "./type"

export const PRIV = {
    create: (data: Data) => {
        if(!(data instanceof Array)) {
            data = [data]
        }

        return Buffer.concat(data.map((priv: Data) => new FrameBuilder("PRIV")
            .appendNullTerminatedValue(priv.ownerIdentifier)
            .appendValue(priv.data instanceof Buffer ? priv.data : Buffer.from(priv.data, "utf8"))
            .getBuffer()))
    },
    read: (buffer: Buffer) => {
        const reader = new FrameReader(buffer)
        return {
            ownerIdentifier: reader.consumeNullTerminatedValue('string'),
            data: reader.consumeStaticValue()
        }
    }
}
