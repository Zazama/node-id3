import { FrameBuilder } from "../FrameBuilder"
import { FrameReader } from "../FrameReader"
import { Popularimeter } from "../types/TagFrames"

export const POPM = {
    create: (data: Popularimeter): Buffer => {
        const { email } = data
        // Nothing specifies in the documentation that an email must be
        // provided, it could be empty I suppose.
        if(!email) {
            throw new RangeError("An email is expected")
        }

        const rating = Math.trunc(data.rating)
        if( isNaN(rating) || rating < 0 || rating > 255) {
            throw new RangeError(
                `Provided rating ${rating} is not in the valid range`
            )
        }

        const counter = Math.trunc(data.counter)
        if (isNaN(counter) || counter < 0) {
            throw new RangeError(
                `Provided counter value must be a positive integer`
            )
        }

        return new FrameBuilder("POPM")
            .appendNullTerminatedValue(email)
            .appendNumber(rating, 1)
            .appendNumber(counter, 4)
            .getBuffer()
    },
    read: (buffer: Buffer): Popularimeter => {
        const reader = new FrameReader(buffer)
        return {
            email: reader.consumeNullTerminatedValue('string'),
            rating: reader.consumeStaticValue('number', 1),
            counter: reader.consumeStaticValue('number')
        }
    }
}
