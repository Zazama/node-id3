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
        return builder.getBufferWithPartialHeader()
    },
    read: (buffer: Buffer): EventTimingCodes => {
        const reader = new FrameReader(buffer)
        return {
            timeStampFormat: reader.consumeNumber({size: 1}) as
                EventTimingCodes["timeStampFormat"],
            keyEvents: Array.from((function*() {
                while(!reader.isBufferEmpty()) {
                    yield {
                        type: reader.consumeNumber({size: 1}),
                        timeStamp: reader.consumeNumber({size: 4})
                    }
                }
            })())
        }
    }
}
