import NodeID3 = require('../index')
import assert = require('assert')
import fs = require('fs')
import path = require('path')
import { smallPngImageData } from './small-image'

const smallImagePath = path.join(__dirname, 'smallImage.png')

describe('NodeID3 COMR frame', function () {
    describe('#create()', function () {
        before(function() {
            fs.writeFileSync(smallImagePath, smallPngImageData)
        })
        it('create COMR frame', function() {
            const frameBufRandomImage = Buffer.from('49443303000000000076434f4d520000006c00000145555231352f444b4b31372e39323200303939393039303168747470733a2f2f6578616d706c652e636f6d0005fffe53006f006d0065006f006e0065000000fffe53006f006d0065007400680069006e0067000000696d6167652f00131313131313131313131313131313', 'hex')

            const commercialFrames: NodeID3.WriteTags['commercialFrame'] = [{
                prices: {
                    EUR: 15,
                    DKK: 17.922
                },
                validUntil: { year: 999, month: 9, day: 1},
                contactUrl: 'https://example.com',
                receivedAs: NodeID3.TagConstants.CommercialFrame.ReceivedAs.AS_NOTE_SHEETS,
                nameOfSeller: 'Someone',
                description: 'Something',
            }]
            const commercialFrame = commercialFrames[0]
            const tags: NodeID3.WriteTags = {
                commercialFrame: commercialFrames
            }

            commercialFrame.sellerLogo = {
                picture: Buffer.alloc(15, 0x13)
            }

            assert.deepStrictEqual(
                NodeID3.create(tags),
                frameBufRandomImage
            )

            commercialFrame.sellerLogo = {
                picture: smallImagePath
            }
            const resultWithPictureString = NodeID3.create(tags)

            commercialFrame.sellerLogo = {
                picture: fs.readFileSync(smallImagePath)
            }
            const resultWithPictureBuffer = NodeID3.create(tags)

            assert.deepStrictEqual(
                resultWithPictureBuffer, resultWithPictureString
            )

            delete commercialFrame.sellerLogo

            const frameBufNoImage = Buffer.from('49443303000000000060434f4d520000005600000145555231352f444b4b31372e39323200303939393039303168747470733a2f2f6578616d706c652e636f6d0005fffe53006f006d0065006f006e0065000000fffe53006f006d0065007400680069006e0067000000', 'hex')

            assert.deepStrictEqual(
                NodeID3.create(tags),
                frameBufNoImage
            )
        })
        after(function() {
            fs.unlinkSync(smallImagePath)
        })
    })

    describe('#read()', function() {
        it('read COMR frame', function() {
            const frameBufRandomImage = Buffer.from('49443303000000000076434f4d520000006c00000145555231352f444b4b31372e39323200303939393039303168747470733a2f2f6578616d706c652e636f6d0005fffe53006f006d0065006f006e0065000000fffe53006f006d0065007400680069006e0067000000696d6167652f00131313131313131313131313131313', 'hex')

            const commercialFrames: NodeID3.Tags['commercialFrame'] = [{
                prices: {
                    EUR: (15).toString(),
                    DKK: (17.922).toString()
                },
                validUntil: { year: 999, month: 9, day: 1},
                contactUrl: 'https://example.com',
                receivedAs: 0x05,
                nameOfSeller: 'Someone',
                description: 'Something',
                sellerLogo: {
                    mimeType: 'image/',
                    picture: Buffer.alloc(15, 0x13)
                }
            }]

            const tags: NodeID3.Tags = {
                commercialFrame: commercialFrames
            }

            assert.deepStrictEqual(
                NodeID3.read(frameBufRandomImage).commercialFrame,
                tags.commercialFrame
            )

            delete commercialFrames[0].sellerLogo
            const frameBufNoImage = Buffer.from('49443303000000000060434f4d520000005600000145555231352f444b4b31372e39323200303939393039303168747470733a2f2f6578616d706c652e636f6d0005fffe53006f006d0065006f006e0065000000fffe53006f006d0065007400680069006e0067000000', 'hex')

            assert.deepStrictEqual(
                NodeID3.read(frameBufNoImage).commercialFrame,
                tags.commercialFrame
            )
        })
    })
})
