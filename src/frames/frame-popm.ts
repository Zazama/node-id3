import { FrameBuilder } from "../FrameBuilder"
import { FrameReader } from "../FrameReader"
import { Popularimeter } from "../types/TagFrames"

export const POPM = {
    create: (data: Popularimeter): Buffer => {
        if(data.email == undefined) {
            throw new RangeError("An email is expected")
        }

        // TODO: starting version 0.3 for both rating and counter do not
        // implicitely trunc and use Number.isInteger() instead to validate

        const rating = Math.trunc(data.rating)
        if( isNaN(rating) || rating < 0 || rating > 255) {
            throw new RangeError(
                `Provided rating ${data.rating} is not in the valid range 0-255`
            )
        }

        // TODO: According to specs, the counter can be omitted
        // TODO: According to specs if the value is bigger than a 32 bits
        // a byte can be added and so on... (very unlikely to happen in
        // real life as it means more than 4GB listenings!)

        const counter = Math.trunc(data.counter)
        if (isNaN(counter) || counter < 0) {
            throw new RangeError(
                `Provided counter ${data.counter} is not a positive integer`
            )
        }

        return new FrameBuilder("POPM")
            .appendNullTerminatedValue(data.email)
            .appendNumber(rating, 1)
            .appendNumber(counter, 4)
            .getBuffer()
    },
    read: (buffer: Buffer): Popularimeter => {
        const reader = new FrameReader(buffer)
        return {
            email: reader.consumeTerminatedText(),
            rating: reader.consumeNumber({size: 1}),
            counter: reader.consumeNumber({size: 4})
        }
    }
}
