import NodeID3 = require('../index')
import assert = require('assert')
import fs = require('fs')
import path = require('path')
import { smallPngImageData, smallJpegImageData } from './small-image'
import { APIC_TYPES } from '../src/definitions/PictureTypes'

const smallImagePath = path.join(__dirname, 'smallImage.png')
const PictureType = NodeID3.TagConstants.AttachedPicture.PictureType

describe('NodeID3 APIC frame', function () {
    describe('#create()', function () {
        before(function() {
            fs.writeFileSync(smallImagePath, smallPngImageData)
        })
        it('create APIC frame', function() {
            const tags: NodeID3.WriteTags = {
                image: {
                    description: "asdf",
                    imageBuffer: smallJpegImageData,
                    mime: "image/jpeg",
                    type: {
                        id: PictureType.FRONT_COVER
                    }
                }
            }

            assert.strictEqual(Buffer.compare(
                NodeID3.create(tags),
                Buffer.from('4944330300000000003B4150494300000031000001696D6167652F6A7065670003FFFE610073006400660000005B307836312C20307836322C20307836332C20307836345D', 'hex')
            ), 0)

            assert.strictEqual(Buffer.compare(
                NodeID3.create({
                    image: smallImagePath
                }),
                NodeID3.create({
                    image: smallPngImageData
                })
            ), 0)

            // iTunes fix if description is empty
            assert.strictEqual(NodeID3.create({
                image: fs.readFileSync(smallImagePath)
            })[20], 0x00)
        })
        after(function() {
            fs.unlinkSync(smallImagePath)
        })
    })

    describe('#read()', function() {
        it('read APIC frame', function() {
            const withDescription = Buffer.from("4944330300000000101C4150494300000016000000696D6167652F6A7065670003617364660061626364", "hex")

            const withoutDescription = Buffer.from("494433030000000000264150494300000012000000696D6167652F6A70656700030061626364", "hex")

            const imageWithoutDescription = {
                description: "",
                imageBuffer: Buffer.from([0x61, 0x62, 0x63, 0x64]),
                mime: "image/jpeg",
                type: {
                    id: PictureType.FRONT_COVER,
                    name: APIC_TYPES[PictureType.FRONT_COVER]
                }
            }
            const imageWithDescription = {
                ...imageWithoutDescription,
                description: "asdf"
            }

            assert.deepStrictEqual(
                NodeID3.read(withDescription).image,
                imageWithDescription
            )

            assert.deepStrictEqual(
                NodeID3.read(withoutDescription).image,
                imageWithoutDescription
            )
        })
    })
})
