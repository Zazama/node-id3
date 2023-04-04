import { TextEncoding } from '../definitions/Encoding'
import { FrameBuilder } from "../FrameBuilder"
import { FrameReader } from "../FrameReader"
import { CommercialFrame } from '../types/TagFrames'
import { retrievePictureAndMimeType } from './util-picture'

const toZeroPaddedString = (value: number, width: number) =>
    value.toString().padStart(width, '0').substring(0, width)

export const COMR = {
    create: (comr: CommercialFrame) => {
        const builder = new FrameBuilder("COMR", TextEncoding.UTF_16_WITH_BOM)

        // Price string
        const priceString =
            Object
                .entries(comr.prices || {})
                .map(
                    ([currencyCode, price]) =>
                        // TODO validate currency code is 3 character long
                        currencyCode.substring(0, 3) + price.toString()
                )
                .join("/")

        builder
            .appendTerminatedText(priceString)
            .appendText(
                toZeroPaddedString(comr.validUntil.year, 4) +
                toZeroPaddedString(comr.validUntil.month, 2) +
                toZeroPaddedString(comr.validUntil.day, 2)
            )
            .appendTerminatedText(comr.contactUrl ?? "")
            .appendNumber(comr.receivedAs, {size: 1})
            .appendTerminatedTextWithFrameEncoding(comr.nameOfSeller ?? "")
            .appendTerminatedTextWithFrameEncoding(comr.description ?? "")

        // Seller logo
        if (comr.sellerLogo) {
            const { pictureBuffer, mimeType } = retrievePictureAndMimeType({
                filenameOrBuffer: comr.sellerLogo.picture,
                mimeType: comr.sellerLogo.mimeType
            })
            builder.appendTerminatedText(mimeType)
            builder.appendBuffer(pictureBuffer)
        }
        return builder.getBufferWithPartialHeader()
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
