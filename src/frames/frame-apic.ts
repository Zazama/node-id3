import * as fs from "fs"
import { FrameBuilder } from "../FrameBuilder"
import { FrameReader } from "../FrameReader"
import { APIC_TYPES } from '../definitions/PictureTypes'
import { TagConstants } from '../definitions/TagConstants'
import * as ID3Util from "../ID3Util"
import { isBuffer, isString } from '../util'
import { TextEncoding } from '../definitions/Encoding'
import { Image } from '../types/TagFrames'

export const APIC = {
    create: (data: Image | Buffer | string) => {
        const image: Partial<Image> = (() => {
            if (isBuffer(data)) {
                return {
                    imageBuffer: Buffer.from(data)
                }
            }
            if (isString(data)) {
                return {
                    imageBuffer: fs.readFileSync(data)
                }
            }
            return data
        })()
        if (!image.imageBuffer) {
            throw new TypeError("Missing image data")
        }

        const {
            mime = ID3Util.getPictureMimeTypeFromBuffer(image.imageBuffer)
        } = image

        // Fix a bug in iTunes where the artwork is not recognized when the
        // description is empty using UTF-16.
        // Instead, if the description is empty, use encoding 0x00
        // (ISO-8859-1).
        const { description = '' } = image
        const encoding = description ?
            TextEncoding.UTF_16_WITH_BOM : TextEncoding.ISO_8859_1

        return new FrameBuilder('APIC')
            .appendNumber(encoding, 1)
            .appendNullTerminatedValue(mime)
            .appendNumber(image.type?.id
                ?? TagConstants.AttachedPicture.PictureType.FRONT_COVER, 1)
            .appendNullTerminatedValue(description, encoding)
            .appendValue(image.imageBuffer)
            .getBuffer()
    },
    read: (buffer: Buffer, version: number): Image => {
        const reader = new FrameReader(buffer, 0)
        return {
            mime: version === 2
                ? reader.consumeStaticValue('string', 3, 0x00)
                : reader.consumeNullTerminatedValue('string', 0x00),
            type: (() => {
                const typeId = reader.consumeStaticValue('number', 1)
                return {
                    id: typeId,
                    name: APIC_TYPES[typeId]
                }
            })(),
            description: reader.consumeNullTerminatedValue('string'),
            imageBuffer: reader.consumeStaticValue()
        }
    }
}
