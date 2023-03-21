import fs = require('fs')
import { FrameBuilder } from "../FrameBuilder"
import { FrameReader } from "../FrameReader"
import * as ID3Util from "../ID3Util"
import { isString } from '../util'
import type { Data } from "./type"

export const COMR = {
    create: (comr: Data) => {
        const prices = comr.prices || {}
        const builder = new FrameBuilder("COMR")

        // Text encoding
        builder.appendNumber(0x01, 1)
        // Price string
        const priceString = Object.entries(prices).map((price: Data) => {
            return price[0].substring(0, 3) + price[1].toString()
        }).join('/')
        builder.appendNullTerminatedValue(priceString, 0x00)
        // Valid until
        builder.appendValue(
            comr.validUntil.year.toString().padStart(4, '0').substring(0, 4) +
            comr.validUntil.month.toString().padStart(2, '0').substring(0, 2) +
            comr.validUntil.day.toString().padStart(2, '0').substring(0, 2),
            8, 0x00
        )
        // Contact URL
        builder.appendNullTerminatedValue(comr.contactUrl, 0x00)
        // Received as
        builder.appendNumber(comr.receivedAs, 1)
        // Name of seller
        builder.appendNullTerminatedValue(comr.nameOfSeller, 0x01)
        // Description
        builder.appendNullTerminatedValue(comr.description, 0x01)
        // Seller logo
        if(comr.sellerLogo) {
            const pictureFilenameOrBuffer = comr.sellerLogo.picture
            const picture = isString(pictureFilenameOrBuffer)
                ? fs.readFileSync(comr.sellerLogo.picture)
                : pictureFilenameOrBuffer

            let mimeType = comr.sellerLogo.mimeType || ID3Util.getPictureMimeTypeFromBuffer(picture)

            // Only image/png and image/jpeg allowed
            if (mimeType !== 'image/png' && 'image/jpeg') {
                mimeType = 'image/'
            }

            builder.appendNullTerminatedValue(mimeType || '', 0x00)
            builder.appendValue(picture)
        }
        return builder.getBuffer()
    },
    read: (buffer: Buffer) => {
        const reader = new FrameReader(buffer, 0)

        const tag: Data = {}

        // Price string
        const priceStrings = reader.consumeNullTerminatedValue('string', 0x00)
            .split('/')
            .filter((price) => price.length > 3)
        tag.prices = {}
        for(const price of priceStrings) {
            tag.prices[price.substring(0, 3)] = price.substring(3)
        }
        // Valid until
        const validUntilString = reader.consumeStaticValue('string', 8, 0x00)
        tag.validUntil = { year: 0, month: 0, day: 0 }
        if(/^\d+$/.test(validUntilString)) {
            tag.validUntil.year = parseInt(validUntilString.substring(0, 4))
            tag.validUntil.month = parseInt(validUntilString.substring(4, 6))
            tag.validUntil.day = parseInt(validUntilString.substring(6))
        }
        // Contact URL
        tag.contactUrl = reader.consumeNullTerminatedValue('string', 0x00)
        // Received as
        tag.receivedAs = reader.consumeStaticValue('number', 1)
        // Name of seller
        tag.nameOfSeller = reader.consumeNullTerminatedValue('string')
        // Description
        tag.description = reader.consumeNullTerminatedValue('string')
        // Seller logo
        const mimeType = reader.consumeNullTerminatedValue('string', 0x00)
        const picture = reader.consumeStaticValue('buffer')
        if(picture && picture.length > 0) {
            tag.sellerLogo = {
                mimeType,
                picture
            }
        }

        return tag
    }
}
