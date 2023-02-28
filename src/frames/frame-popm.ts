import { FrameBuilder } from "../FrameBuilder"
import { FrameReader } from "../FrameReader"
import type { Data } from "./type"

export const POPM = {
    create: (data: Data) => {
        const email = data.email
        let rating = Math.trunc(data.rating)
        let counter = Math.trunc(data.counter)
        if(!email) {
            return null
        }
        if(isNaN(rating) || rating < 0 || rating > 255) {
            rating = 0
        }
        if(isNaN(counter) || counter < 0) {
            counter = 0
        }

        return new FrameBuilder("POPM")
            .appendNullTerminatedValue(email)
            .appendNumber(rating, 1)
            .appendNumber(counter, 4)
            .getBuffer()
    },
    read: (buffer: Buffer) => {
        const reader = new FrameReader(buffer)
        return {
            email: reader.consumeNullTerminatedValue('string'),
            rating: reader.consumeStaticValue('number', 1),
            counter: reader.consumeStaticValue('number')
        }
    }
}
