import fs = require('fs')
import { TextEncoding } from '../definitions/Encoding'
import { FrameBuilder } from "../FrameBuilder"
import { FrameReader } from "../FrameReader"
import * as ID3Util from "../ID3Util"
import { CommercialFrame } from '../types/TagFrames'
import { isString } from '../util'

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
            const pictureFilenameOrBuffer = comr.sellerLogo.picture
            const picture = isString(pictureFilenameOrBuffer)
                ? fs.readFileSync(comr.sellerLogo.picture)
                : pictureFilenameOrBuffer

            let mimeType = comr.sellerLogo.mimeType || ID3Util.getPictureMimeTypeFromBuffer(picture)

            // Only image/png and image/jpeg allowed
            if (mimeType !== 'image/png' && 'image/jpeg') {
                mimeType = 'image/'
            }

            builder.appendNullTerminatedValue(
                mimeType || '', TextEncoding.ISO_8859_1
            )
            builder.appendValue(picture)
        }
        return builder.getBuffer()
    },

    read: (buffer: Buffer): CommercialFrame => {
        const reader = new FrameReader(buffer, 0)

        const prices = reader.consumeNullTerminatedValue('string', 0x00)
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
        const validUntilString = reader.consumeStaticValue('string', 8, 0x00)
        const validUntil = { year: 0, month: 0, day: 0 }
        if(/^\d+$/.test(validUntilString)) {
            validUntil.year = parseInt(validUntilString.substring(0, 4))
            validUntil.month = parseInt(validUntilString.substring(4, 6))
            validUntil.day = parseInt(validUntilString.substring(6))
        }

        const contactUrl = reader.consumeNullTerminatedValue(
            'string', TextEncoding.ISO_8859_1
        )
        const receivedAs = reader.consumeStaticValue('number', 1)
        const nameOfSeller = reader.consumeNullTerminatedValue('string')
        const description = reader.consumeNullTerminatedValue('string')

        // Seller logo
        const mimeType = reader.consumeNullTerminatedValue(
            'string', TextEncoding.ISO_8859_1
        )
        const picture = reader.consumeStaticValue('buffer')

        return {
            prices,
            validUntil,
            contactUrl,
            receivedAs,
            nameOfSeller,
            description,
            ...(picture && picture.length > 0 ? {
                sellerLogo: {
                    mimeType, picture
                }
            } : {
            })
        }
    }
}
