import { FrameBuilder } from "../FrameBuilder"
import { FrameReader } from "../FrameReader"
import { APIC_TYPES } from '../definitions/PictureTypes'
import { TagConstants } from '../definitions/TagConstants'
import { isBuffer, isString } from '../util'
import { TextEncoding } from '../definitions/Encoding'
import { Image } from '../types/TagFrames'
import { retrievePictureAndMimeType } from "./util-picture"

export const APIC = {
    create: (input: Image | Buffer | string): Buffer => {
        const image = (() => {
            const data: Partial<Image> = isBuffer(input) || isString(input) ? {
                imageBuffer: input
            } : input
            const { pictureBuffer, mimeType } = retrievePictureAndMimeType({
                filenameOrBuffer: data.imageBuffer,
                mimeType: data.mime
            })
            return {
                pictureBuffer,
                mimeType,
                type: data.type,
                description: data.description
            }
        })()

        // Fix a bug in iTunes where the artwork is not recognized when the
        // description is empty using UTF-16.
        // Instead, if the description is empty, use encoding 0x00
        // (ISO-8859-1).
        const { description = '' } = image
        const textEncoding = description ?
            TextEncoding.UTF_16_WITH_BOM : TextEncoding.ISO_8859_1

        return new FrameBuilder('APIC')
            .appendNumber(textEncoding, 1)
            .appendNullTerminatedValue(image.mimeType)
            .appendNumber(image.type?.id
                ?? TagConstants.AttachedPicture.PictureType.FRONT_COVER, 1)
            .appendNullTerminatedValue(description, textEncoding)
            .appendValue(image.pictureBuffer)
            .getBuffer()
    },
    read: (buffer: Buffer, version: number): Image => {
        const reader = new FrameReader(buffer, {consumeEncodingByte: true})
        return {
            mime: version === 2
                ? reader.consumeText({size: 3})
                : reader.consumeTerminatedText(),
            type: (() => {
                const typeId = reader.consumeNumber({size: 1})
                return {
                    id: typeId,
                    name: APIC_TYPES[typeId]
                }
            })(),
            description: reader.consumeTerminatedTextWithFrameEncoding(),
            imageBuffer: reader.consumePossiblyEmptyBuffer()
        }
    }
}
