import { TextEncoding } from '../definitions/Encoding'
import { FrameBuilder } from "../FrameBuilder"
import { FrameReader } from "../FrameReader"
import { CommercialFrame } from '../types/TagFrames'
import { retrievePictureAndMimeType } from './util-picture'

export const COMR = {
    create: (comr: CommercialFrame) => {
        const prices = comr.prices || {}
        const builder = new FrameBuilder("COMR")

        const textEncoding = TextEncoding.UTF_16_WITH_BOM

        builder.appendNumber(textEncoding, 1)

        // Price string
        const priceString = Object.entries(prices).map((price) => {
            return price[0].substring(0, 3) + price[1].toString()
        }).join('/')
        builder.appendNullTerminatedValue(priceString, TextEncoding.ISO_8859_1)

        // Valid until
        builder.appendValue(
            comr.validUntil.year.toString().padStart(4, '0').substring(0, 4) +
            comr.validUntil.month.toString().padStart(2, '0').substring(0, 2) +
            comr.validUntil.day.toString().padStart(2, '0').substring(0, 2),
            8, TextEncoding.ISO_8859_1
        )

        builder.appendNullTerminatedValue(
            comr.contactUrl, TextEncoding.ISO_8859_1
        )
        builder.appendNumber(comr.receivedAs, 1)
        builder.appendNullTerminatedValue(comr.nameOfSeller, textEncoding)
        builder.appendNullTerminatedValue(comr.description, textEncoding)

        // Seller logo
        if (comr.sellerLogo) {
            const { pictureBuffer, mimeType } = retrievePictureAndMimeType({
                filenameOrBuffer: comr.sellerLogo.picture,
                mimeType: comr.sellerLogo.mimeType
            })
            builder.appendNullTerminatedValue(mimeType, TextEncoding.ISO_8859_1)
            builder.appendValue(pictureBuffer)
        }
        return builder.getBuffer()
    },

    read: (buffer: Buffer): CommercialFrame => {
        const reader = new FrameReader(buffer, {consumeEncodingByte: true})

        const prices = reader.consumeTerminatedText()
            .split('/')
            .filter((price) => price.length > 3)
            .reduce<Record<string, string | number>>(
                (prices, price) => (
                    prices[price.substring(0, 3)] = price.substring(3),
                    prices
                ),
                {}
            )

        // Valid until
        const validUntilString = reader.consumeText({size: 8})
        const validUntil = { year: 0, month: 0, day: 0 }
        if(/^\d+$/.test(validUntilString)) {
            validUntil.year = parseInt(validUntilString.substring(0, 4))
            validUntil.month = parseInt(validUntilString.substring(4, 6))
            validUntil.day = parseInt(validUntilString.substring(6))
        }

        return {
            prices,
            validUntil,
            contactUrl: reader.consumeTerminatedText(),
            receivedAs: reader.consumeNumber({size: 1}),
            nameOfSeller: reader.consumeTerminatedTextWithFrameEncoding(),
            description: reader.consumeTerminatedTextWithFrameEncoding(),
            ...(reader.isBufferEmpty() ? {} : {
                sellerLogo: {
                    mimeType: reader.consumeTerminatedText(),
                    picture: reader.consumePossiblyEmptyBuffer()
                }
            })
        }
    }
}
