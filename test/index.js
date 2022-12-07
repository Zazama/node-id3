const NodeID3 = require('../index')
const assert = require('assert')
const chai = require('chai')
const iconv = require('iconv-lite')
const fs = require('fs')
const ID3Util = require('../src/ID3Util')

describe('NodeID3', function () {
    describe('#create()', function () {
        it('empty tags', function () {
            assert.strictEqual(NodeID3.create({}).compare(Buffer.from([0x49, 0x44, 0x33, 0x03, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00])), 0)
        })
        it('text frames', function () {
            const tags = {
                TIT2: "abcdeÜ看板かんばん",
                album: "nasÖÄkdnasd",
                notfound: "notfound",
                year: 1990
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

        it('user defined text frames', function() {
            let tags = {
                userDefinedText: {
                    description: "abc",
                    value: "defg"
                }
            }
            let buffer = NodeID3.create(tags).slice(10)
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

            tags = {
                userDefinedText: [{
                    description: "abc",
                    value: "defg"
                }, {
                    description: "hij",
                    value: "klmn"
                }]
            }
            buffer = NodeID3.create(tags).slice(10)
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
                recordingTime: 4
            }

            assert.deepStrictEqual(
                NodeID3.create(tags),
                frameBuf
            )
        })
    })

    describe('#write()', function() {
        const nonExistingFilepath = './hopefully-does-not-exist.mp3'
        it('sync not existing filepath', function() {
            chai.assert.isFalse(fs.existsSync(nonExistingFilepath))
            chai.assert.instanceOf(
                NodeID3.write({}, nonExistingFilepath), Error
            )
        })
        it('async not existing filepath', function() {
            chai.assert.isFalse(fs.existsSync(nonExistingFilepath))
            NodeID3.write({}, nonExistingFilepath, function(err) {
                if(!(err instanceof Error)) {
                    assert.fail("No error thrown on non-existing filepath")
                }
            })
        })

        const buffer = Buffer.from([0x02, 0x06, 0x12, 0x22])
        let tags = {title: "abc"}
        const filepath = './testfile.mp3'

        it('sync write file without id3 tag', function() {
            fs.writeFileSync(filepath, buffer, 'binary')
            NodeID3.write(tags, filepath)
            const newFileBuffer = fs.readFileSync(filepath)
            fs.unlinkSync(filepath)
            assert.strictEqual(Buffer.compare(
                newFileBuffer,
                Buffer.concat([NodeID3.create(tags), buffer])
            ), 0)
        })

        it('async write file without id3 tag', function(done) {
            fs.writeFileSync(filepath, buffer, 'binary')
            NodeID3.write(tags, filepath, function() {
                const newFileBuffer = fs.readFileSync(filepath)
                fs.unlinkSync(filepath)
                if(Buffer.compare(
                    newFileBuffer,
                    Buffer.concat([NodeID3.create(tags), buffer])
                ) === 0) {
                    done()
                } else {
                    done(new Error("buffer not the same"))
                }
            })
        })

        const bufferWithTag = Buffer.concat([NodeID3.create(tags), buffer])
        tags = {album: "ix123"}

        it('sync write file with id3 tag', function() {
            fs.writeFileSync(filepath, bufferWithTag, 'binary')
            NodeID3.write(tags, filepath)
            const newFileBuffer = fs.readFileSync(filepath)
            fs.unlinkSync(filepath)
            assert.strictEqual(Buffer.compare(
                newFileBuffer,
                Buffer.concat([NodeID3.create(tags), buffer])
            ), 0)
        })
        it('async write file with id3 tag', function(done) {
            fs.writeFileSync(filepath, bufferWithTag, 'binary')
            NodeID3.write(tags, filepath, function() {
                const newFileBuffer = fs.readFileSync(filepath)
                fs.unlinkSync(filepath)
                if(Buffer.compare(
                    newFileBuffer,
                    Buffer.concat([NodeID3.create(tags), buffer])
                ) === 0) {
                    done()
                } else {
                    done(new Error("file written incorrectly"))
                }
            })
        })
    })

    describe('#read()', function() {
        it('read empty id3 tag', function() {
            const frame = NodeID3.create({})
            assert.deepStrictEqual(
                NodeID3.read(frame),
                {raw: {}}
            )
        })

        it('read text frames id3 tag', function() {
            const frame = NodeID3.create({ title: "asdfghjÄÖP", album: "naBGZwssg" })
            assert.deepStrictEqual(
                NodeID3.read(frame),
                { title: "asdfghjÄÖP", album: "naBGZwssg", raw: { TIT2: "asdfghjÄÖP", TALB: "naBGZwssg" }}
            )
        })

        it('read tag with broken frame', function() {
            const frame = NodeID3.create({ title: "asdfghjÄÖP", album: "naBGZwssg" })
            frame[10] = 0x99
            assert.deepStrictEqual(
                NodeID3.read(frame),
                { album: "naBGZwssg", raw: { TALB: "naBGZwssg" }}
            )
        })

        it('read tag with bigger size', function() {
            const frame = NodeID3.create({ title: "asdfghjÄÖP", album: "naBGZwssg" })
            const newFrameSize = 127
            frame[9] = 127
            assert.ok(frame.length < newFrameSize + 10)
            assert.deepStrictEqual(
                NodeID3.read(frame),
                { title: "asdfghjÄÖP", album: "naBGZwssg", raw: { TIT2: "asdfghjÄÖP", TALB: "naBGZwssg" }}
            )
        })

        it('read tag with smaller size', function() {
            const frame = NodeID3.create({ title: "asdfghjÄÖP", album: "naBGZwssg" })
            frame[9] -= 25
            assert.deepStrictEqual(
                NodeID3.read(frame),
                { title: "asdfghjÄÖP", raw: { TIT2: "asdfghjÄÖP" }}
            )
        })

       it('read tag with invalid size', function() {
            const frame = NodeID3.create({ title: 'a' })
            frame[9] = 128
            assert.deepStrictEqual(
                NodeID3.read(frame).raw,
                {}
            )
        })

        it('read TXXX frame', function() {
            const tags = { userDefinedText: {description: "abc", value: "deg"} }
            const frame = NodeID3.create(tags)
            assert.deepStrictEqual(
                NodeID3.read(frame),
                {
                    userDefinedText: [tags.userDefinedText],
                    raw: {
                        TXXX: [tags.userDefinedText]
                    }
                }
            )
        })

        it('read TXXX array frame', function() {
            const tags = { userDefinedText: [{description: "abc", value: "deg"}, {description: "abcd", value: "efgh"}] }
            const frame = NodeID3.create(tags)
            assert.deepStrictEqual(
                NodeID3.read(frame),
                {
                    userDefinedText: tags.userDefinedText,
                    raw: {
                        TXXX: tags.userDefinedText
                    }
                }
            )
        })

        it('create mixed v3/v4 tag', function() {
            const frameBuf = Buffer.from('494433030000000000315449543200000009000001fffe61006c006c005459455200000005000001fffe33005444524300000005000001fffe3400', 'hex')

            const tags = {
                title: "all",
                year: "3",
                recordingTime: "4"
            }

            assert.deepStrictEqual(
                NodeID3.read(frameBuf, { noRaw: true }),
                tags
            )
        })

        it('read exclude', function() {
            const tags = {
                TIT2: "abcdeÜ看板かんばん",
                album: "nasÖÄkdnasd",
                year: "1990"
            }

            const buffer = NodeID3.create(tags)
            const read = NodeID3.read(buffer, { exclude: ['TIT2'] })
            delete read.raw
            delete tags.TIT2
            assert.deepStrictEqual(
                read,
                tags
            )
        })

        it('read include', function() {
            const tags = {
                title: "abcdeÜ看板かんばん",
                album: "nasÖÄkdnasd",
                year: "1990"
            }

            const buffer = NodeID3.create(tags)
            const read = NodeID3.read(buffer, { include: ['TALB', 'TIT2'] })
            delete read.raw
            delete tags.year
            assert.deepStrictEqual(
                read,
                tags
            )
        })

        it('onlyRaw', function() {
            const tags = {
                TIT2: "abcdeÜ看板かんばん",
                TALB: "nasÖÄkdnasd"
            }

            const buffer = NodeID3.create(tags)
            const read = NodeID3.read(buffer, { onlyRaw: true })
            assert.deepStrictEqual(
                read,
                tags
            )
        })

        it('noRaw', function() {
            const tags = {
                title: "abcdeÜ看板かんばん",
                album: "nasÖÄkdnasd"
            }

            const buffer = NodeID3.create(tags)
            const read = NodeID3.read(buffer, { noRaw: true })
            assert.deepStrictEqual(
                read,
                tags
            )
        })

        it('compressed frame', function() {
            const frameBufV3 = Buffer.from('4944330300000000001c5449543200000011008000000005789c6328492d2e0100045e01c1', 'hex')
            const frameBufV4 = Buffer.from('4944330400000000001c5449543200000011000900000005789c6328492d2e0100045e01c1', 'hex')
            const tags = { TIT2: 'test' }

            assert.deepStrictEqual(
                NodeID3.read(frameBufV3).raw,
                tags
            )

            assert.deepStrictEqual(
                NodeID3.read(frameBufV4).raw,
                tags
            )
        })
    })
})

function sizeToBuffer(totalSize) {
    const buffer = Buffer.alloc(4)
    buffer.writeUInt32BE(totalSize)
    return buffer
}
