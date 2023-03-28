import { FrameBuilder } from "../FrameBuilder"
import { FrameReader } from "../FrameReader"
import { EventTimingCodes } from "../types/TagFrames"

export const ETCO = {
    create: (data: EventTimingCodes): Buffer => {
        const builder = new FrameBuilder("ETCO")
            .appendNumber(data.timeStampFormat, 1)
        data.keyEvents.forEach((keyEvent) => {
            builder
                .appendNumber(keyEvent.type, 1)
                .appendNumber(keyEvent.timeStamp, 4)
        })
        return builder.getBuffer()
    },
    read: (buffer: Buffer): EventTimingCodes => {
        const reader = new FrameReader(buffer)
        return {
            timeStampFormat: reader.consumeStaticValue(
                'number', 1
            ) as EventTimingCodes["timeStampFormat"],
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
