import * as NodeID3 from '../../index'
import assert = require('assert')
import iconv = require('iconv-lite')
import * as ID3Util from '../../src/ID3Util'

describe('NodeID3 API', function () {
    describe('#create()', function () {
        it('empty tags', function () {
            assert.strictEqual(
                NodeID3.create({}).compare(
                    Buffer.from([0x49, 0x44, 0x33, 0x03, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00])
                ),
                 0
            )
        })
        it('text frames', function () {
            const tags = {
                ...{
                    TIT2: "abcdeÜ看板かんばん",
                    album: "nasÖÄkdnasd",
                    year: "1990"
                } satisfies NodeID3.WriteTags,
                notfound: "notfound"
            }
            const buffer = NodeID3.create(tags)
            const titleSize = 10 + 1 + iconv.encode(tags.TIT2, 'utf16').length
            const albumSize = 10 + 1 + iconv.encode(tags.album, 'utf16').length
            const yearSize = 10 + 1 + iconv.encode(tags.year, 'utf16').length
            assert.strictEqual(buffer.length,
                10 + // ID3 frame header
                titleSize + // TIT2 header + encoding byte + utf16 bytes + utf16 string
                albumSize +// same as above for album,
                yearSize
            )
            // Check ID3 header
            assert.ok(buffer.includes(
                Buffer.concat([
                    Buffer.from([0x49, 0x44, 0x33, 0x03, 0x00, 0x00]),
                    Buffer.from(ID3Util.encodeSize(titleSize + albumSize + yearSize))
                ])
            ))

            // Check TIT2 frame
            assert.ok(buffer.includes(
                Buffer.concat([
                    Buffer.from([0x54, 0x49, 0x54, 0x32]),
                    sizeToBuffer(titleSize - 10),
                    Buffer.from([0x00, 0x00]),
                    Buffer.from([0x01]),
                    iconv.encode(tags.TIT2, 'utf16')
                ])
            ))
            // Check album frame
            assert.ok(buffer.includes(
                Buffer.concat([
                    Buffer.from([0x54, 0x41, 0x4C, 0x42]),
                    sizeToBuffer(albumSize - 10),
                    Buffer.from([0x00, 0x00]),
                    Buffer.from([0x01]),
                    iconv.encode(tags.album, 'utf16')
                ])
            ))
            assert.ok(buffer.includes(
                Buffer.concat([
                    Buffer.from([0x54, 0x59, 0x45, 0x52]),
                    sizeToBuffer(yearSize - 10),
                    Buffer.from([0x00, 0x00]),
                    Buffer.from([0x01]),
                    iconv.encode(tags.year, 'utf16')
                ])
            ))
        })

        it('user defined text frame single value', function() {
            const tags = {
                userDefinedText: {
                    description: "abc",
                    value: "defg"
                }
            } satisfies NodeID3.WriteTags
            const buffer = NodeID3.create(tags).subarray(10)
            const descEncoded = iconv.encode(tags.userDefinedText.description + "\0", "UTF-16")
            const valueEncoded = iconv.encode(tags.userDefinedText.value, "UTF-16")

            assert.strictEqual(Buffer.compare(
                buffer,
                Buffer.concat([
                    Buffer.from([0x54, 0x58, 0x58, 0x58]),
                    sizeToBuffer(1 + descEncoded.length + valueEncoded.length),
                    Buffer.from([0x00, 0x00]),
                    Buffer.from([0x01]),
                    descEncoded,
                    valueEncoded
                ])
            ), 0)
        })

        it('user defined text frame array', function() {
            const tags = {
                userDefinedText: [{
                    description: "abc",
                    value: "defg"
                }, {
                    description: "hij",
                    value: "klmn"
                }]
            } satisfies NodeID3.WriteTags
            const buffer = NodeID3.create(tags).subarray(10)
            const desc1Encoded = iconv.encode(tags.userDefinedText[0].description + "\0", "UTF-16")
            const value1Encoded = iconv.encode(tags.userDefinedText[0].value, "UTF-16")
            const desc2Encoded = iconv.encode(tags.userDefinedText[1].description + "\0", "UTF-16")
            const value2Encoded = iconv.encode(tags.userDefinedText[1].value, "UTF-16")

            assert.strictEqual(Buffer.compare(
                buffer,
                Buffer.concat([
                    Buffer.from([0x54, 0x58, 0x58, 0x58]),
                    sizeToBuffer(1 + desc1Encoded.length + value1Encoded.length),
                    Buffer.from([0x00, 0x00]),
                    Buffer.from([0x01]),
                    desc1Encoded,
                    value1Encoded,
                    Buffer.from([0x54, 0x58, 0x58, 0x58]),
                    sizeToBuffer(1 + desc2Encoded.length + value2Encoded.length),
                    Buffer.from([0x00, 0x00]),
                    Buffer.from([0x01]),
                    desc2Encoded,
                    value2Encoded
                ])
            ), 0)
        })

        it('create mixed v3/v4 tag', function() {
            const frameBuf = Buffer.from('494433030000000000315449543200000009000001fffe61006c006c005459455200000005000001fffe33005444524300000005000001fffe3400', 'hex')

            const tags = {
                title: "all",
                year: 3,
                recordingTime: "4"
            } satisfies NodeID3.WriteTags

            assert.deepStrictEqual(
                NodeID3.create(tags),
                frameBuf
            )
        })
    })
})

function sizeToBuffer(totalSize: number) {
    const buffer = Buffer.alloc(4)
    buffer.writeUInt32BE(totalSize)
    return buffer
}
