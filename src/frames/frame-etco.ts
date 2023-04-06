import { FrameBuilder } from "../FrameBuilder"
import { FrameReader } from "../FrameReader"
import { EventTimingCodes } from "../types/TagFrames"

export const ETCO = {
    create: (data: EventTimingCodes): Buffer => {
        return new FrameBuilder("ETCO")
            .appendNumber(data.timeStampFormat, {size: 1})
            .appendArray(data.keyEvents, (builder, keyEvent) => builder
                .appendNumber(keyEvent.type, {size: 1})
                .appendNumber(keyEvent.timeStamp, {size: 4})
            )
            .getBufferWithPartialHeader()
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
