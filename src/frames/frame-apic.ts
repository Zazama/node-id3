import fs = require('fs')
import { FrameBuilder } from "../FrameBuilder"
import { FrameReader } from "../FrameReader"
import { APIC_TYPES } from '../definitions/PictureTypes'
import { TagConstants } from '../definitions/TagConstants'
import * as ID3Util from "../ID3Util"
import { isString } from '../util'
import { TextEncoding } from '../definitions/Encoding'
import type { Data } from "./type"

export const APIC = {
    create: (data: Data) => {
        try {
            if (data instanceof Buffer) {
                data = {
                    imageBuffer: Buffer.from(data)
                }
            } else if (isString(data)) {
                data = {
                    imageBuffer: fs.readFileSync(data)
                }
            } else if (!data.imageBuffer) {
                return Buffer.alloc(0)
            }

            let mime_type = data.mime

            if(!mime_type) {
                mime_type = ID3Util.getPictureMimeTypeFromBuffer(data.imageBuffer)
            }

            const pictureType = data.type || {}
            const pictureTypeId = pictureType.id === undefined
                ? TagConstants.AttachedPicture.PictureType.FRONT_COVER
                : pictureType.id

            /*
             * Fix a bug in iTunes where the artwork is not recognized when the
             * description is empty using UTF-16.
             * Instead, if the description is empty, use encoding 0x00
             * (ISO-8859-1).
             */
            const { description = '' } = data
            const encoding = description ?
                TextEncoding.UTF_16_WITH_BOM : TextEncoding.ISO_8859_1
            return new FrameBuilder('APIC')
              .appendNumber(encoding, 1)
              .appendNullTerminatedValue(mime_type)
              .appendNumber(pictureTypeId, 1)
              .appendNullTerminatedValue(description, encoding)
              .appendValue(data.imageBuffer)
              .getBuffer()
        } catch(error) {
            return null
        }
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
