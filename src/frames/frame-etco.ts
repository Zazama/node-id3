import { FrameBuilder } from "../FrameBuilder"
import { FrameReader } from "../FrameReader"
import type { Data } from "./type"

export const ETCO = {
    create: (data: Data) => {
        const builder = new FrameBuilder("ETCO")
            .appendNumber(data.timeStampFormat, 1)
        data.keyEvents.forEach((keyEvent: Data) => {
            builder
                .appendNumber(keyEvent.type, 1)
                .appendNumber(keyEvent.timeStamp, 4)
        })

        return builder.getBuffer()
    },
    read: (buffer: Buffer) => {
        const reader = new FrameReader(buffer)

        return {
            timeStampFormat: reader.consumeStaticValue('number', 1),
            keyEvents: Array.from((function*() {
                while(true) {
                    const type = reader.consumeStaticValue('number', 1)
                    const timeStamp = reader.consumeStaticValue('number', 4)
                    if (type === undefined || timeStamp === undefined) {
                        break
                    }
                    yield {type, timeStamp}
                }
            })())
        }
    }
}
