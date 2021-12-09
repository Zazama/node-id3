const NodeID3 = require('../index.js')
const jsmediatags = require("jsmediatags")
const assert = require('assert')
const chai = require('chai')
const expect = chai.expect
const iconv = require('iconv-lite')
const fs = require('fs')
const ID3Util = require('../src/ID3Util')

describe('NodeID3', function () {
    describe('#create()', function () {
        it('empty tags', function () {
            assert.strictEqual(NodeID3.create({}).compare(Buffer.from([0x49, 0x44, 0x33, 0x03, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00])), 0)
        })
        it('text frames', function () {
            let tags = {
                TIT2: "abcdeÜ看板かんばん",
                album: "nasÖÄkdnasd",
                notfound: "notfound",
                year: 1990
            }
            let buffer = NodeID3.create(tags)
            let titleSize = 10 + 1 + iconv.encode(tags.TIT2, 'utf16').length
            let albumSize = 10 + 1 + iconv.encode(tags.album, 'utf16').length
            let yearSize = 10 + 1 + iconv.encode(tags.year, 'utf16').length
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

        it('user defined text frames', function () {
            let tags = {
                userDefinedText: {
                    description: "abc",
                    value: "defg"
                }
            }
            let buffer = NodeID3.create(tags).slice(10)
            let descEncoded = iconv.encode(tags.userDefinedText.description + "\0", "UTF-16")
            let valueEncoded = iconv.encode(tags.userDefinedText.value, "UTF-16")

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
            let desc1Encoded = iconv.encode(tags.userDefinedText[0].description + "\0", "UTF-16")
            let value1Encoded = iconv.encode(tags.userDefinedText[0].value, "UTF-16")
            let desc2Encoded = iconv.encode(tags.userDefinedText[1].description + "\0", "UTF-16")
            let value2Encoded = iconv.encode(tags.userDefinedText[1].value, "UTF-16")

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

        it('create APIC frame', function () {
            let tags = {
                image: {
                    description: "asdf",
                    imageBuffer: Buffer.from('5B307836312C20307836322C20307836332C20307836345D', 'hex'),
                    mime: "image/jpeg",
                    type: { id: 3, name: "front cover" }
                }
            }

            assert.strictEqual(Buffer.compare(
                NodeID3.create(tags),
                Buffer.from('4944330300000000003B4150494300000031000001696D6167652F6A7065670003FFFE610073006400660000005B307836312C20307836322C20307836332C20307836345D', 'hex')
            ), 0)

            assert.strictEqual(Buffer.compare(
                NodeID3.create({
                    image: __dirname + '/smallimg'
                }),
                NodeID3.create({
                    image: {
                        imageBuffer: fs.readFileSync(__dirname + '/smallimg')
                    }
                })
            ), 0)

            assert.strictEqual(Buffer.compare(
                NodeID3.create({
                    image: fs.readFileSync(__dirname + '/smallimg')
                }),
                NodeID3.create({
                    image: {
                        imageBuffer: fs.readFileSync(__dirname + '/smallimg')
                    }
                })
            ), 0)

            // iTunes fix if description is empty
            assert.strictEqual(NodeID3.create({
                image: fs.readFileSync(__dirname + '/smallimg')
            })[20], 0x00)
        })

        it('create USLT frame', function () {
            let tags = {
                unsynchronisedLyrics: {
                    language: "deu",
                    shortText: "Haiwsää#",
                    text: "askdh ashd olahs elowz dlouaish dkajh"
                }
            }

            assert.strictEqual(Buffer.compare(
                NodeID3.create(tags),
                Buffer.from('4944330300000000006E55534C5400000064000001646575FFFE48006100690077007300E400E40023000000FFFE610073006B00640068002000610073006800640020006F006C00610068007300200065006C006F0077007A00200064006C006F0075006100690073006800200064006B0061006A006800', 'hex')
            ), 0)
        })

        it('create COMM frame', function () {
            const tags = {
                comment: {
                    language: "deu",
                    shortText: "Haiwsää#",
                    text: "askdh ashd olahs elowz dlouaish dkajh"
                }
            }
            let frameBuf = Buffer.from('4944330300000000006E434F4D4D00000064000001646575FFFE48006100690077007300E400E40023000000FFFE610073006B00640068002000610073006800640020006F006C00610068007300200065006C006F0077007A00200064006C006F0075006100690073006800200064006B0061006A006800', 'hex')

            assert.strictEqual(Buffer.compare(
                NodeID3.create(tags),
                frameBuf
            ), 0)
        })

        it('create POPM frame', function () {
            let frameBuf = Buffer.from('49443303000000000020504F504D0000001600006D61696C406578616D706C652E636F6D00C00000000C', 'hex')
            const tags = {
                popularimeter: {
                    email: "mail@example.com",
                    rating: 192,  // 1-255
                    counter: 12
                }
            }

            assert.strictEqual(Buffer.compare(
                NodeID3.create(tags),
                frameBuf
            ), 0)
        })

        it('create PRIV frame', function () {
            let frameBuf = Buffer.from('4944330300000000003250524956000000140000416243006173646F61687764696F686177646177505249560000000A000041624353535300010205', 'hex')
            const tags = {
                PRIV: [{
                    ownerIdentifier: "AbC",
                    data: Buffer.from("asdoahwdiohawdaw")
                }, {
                    ownerIdentifier: "AbCSSS",
                    data: Buffer.from([0x01, 0x02, 0x05])
                }]
            }

            assert.deepStrictEqual(
                NodeID3.create(tags),
                frameBuf
            )
        })

        it("create UFID frame", function () {
            let frameBuf = Buffer.from('4944330300000000001e55464944000000140000416243006173646f61687764696f686177646177', 'hex');
            const tags = {
                UFID: [
                    {
                        ownerIdentifier: "AbC",
                        identifier: "asdoahwdiohawdaw",
                    }
                ],
            };

            assert.deepStrictEqual(NodeID3.create(tags), frameBuf);
        });

        it('create CHAP frame', function () {
            let frameBuf = Buffer.from('494433030000000000534348415000000049000048657921000000138800001F400000007B000001C8544954320000000F000001FFFE6100620063006400650066005450453100000011000001FFFE61006B0073006800640061007300', 'hex')
            const tags = {
                CHAP: [{
                    elementID: "Hey!", //THIS MUST BE UNIQUE!
                    startTimeMs: 5000,
                    endTimeMs: 8000,
                    startOffsetBytes: 123, // OPTIONAL!
                    endOffsetBytes: 456,   // OPTIONAL!
                    tags: {                // OPTIONAL
                        title: "abcdef",
                        artist: "akshdas"
                    }
                }]
            }

            assert.deepStrictEqual(
                NodeID3.create(tags),
                frameBuf
            )
        })

        it('create WXXX frame', function () {
            const frameBuf = Buffer.from('4944330300000000002c5758585800000022000001fffe61006200630064002300000068747470733a2f2f6578616d706c652e636f6d', 'hex')
            const tags = {
                userDefinedUrl: [{
                    description: 'abcd#',
                    url: 'https://example.com'
                }]
            }

            assert.deepStrictEqual(
                NodeID3.create(tags),
                frameBuf
            )
        })

        it('create URL frame', function () {
            const frameBuf = Buffer.from('4944330300000000003b57434f4d00000013000068747470733a2f2f6578616d706c652e636f6d574f414600000014000068747470733a2f2f6578616d706c65322e636f6d', 'hex')
            const tags = {
                commercialUrl: ['https://example.com'],
                fileUrl: 'https://example2.com'
            }

            assert.deepStrictEqual(
                NodeID3.create(tags),
                frameBuf
            )
        })
    })

    describe('#write()', function () {
        it('sync not existing filepath', function () {
            assert.throws(NodeID3.write.bind({}, './hopefullydoesnotexist.mp3'), Error)
        })
        it('async not existing filepath', function () {
            NodeID3.write({}, './hopefullydoesnotexist.mp3', function (err) {
                if (!(err instanceof Error)) {
                    assert.fail("No error thrown on non-existing filepath")
                }
            })
        })

        let buffer = Buffer.from([0x02, 0x06, 0x12, 0x22])
        let tags = { title: "abc" }
        let filepath = './testfile.mp3'

        it('sync write file without id3 tag', function () {
            fs.writeFileSync(filepath, buffer, 'binary')
            NodeID3.write(tags, filepath)
            let newFileBuffer = fs.readFileSync(filepath)
            fs.unlinkSync(filepath)
            assert.strictEqual(Buffer.compare(
                newFileBuffer,
                Buffer.concat([NodeID3.create(tags), buffer])
            ), 0)
        })
        it('async write file without id3 tag', function (done) {
            fs.writeFileSync(filepath, buffer, 'binary')
            NodeID3.write(tags, filepath, function () {
                let newFileBuffer = fs.readFileSync(filepath)
                fs.unlinkSync(filepath)
                if (Buffer.compare(
                    newFileBuffer,
                    Buffer.concat([NodeID3.create(tags), buffer])
                ) === 0) {
                    done()
                } else {
                    done(new Error("buffer not the same"))
                }
            })
        })

        let bufferWithTag = Buffer.concat([NodeID3.create(tags), buffer])
        tags = { album: "ix123" }

        it('sync write file with id3 tag', function () {
            fs.writeFileSync(filepath, bufferWithTag, 'binary')
            NodeID3.write(tags, filepath)
            let newFileBuffer = fs.readFileSync(filepath)
            fs.unlinkSync(filepath)
            assert.strictEqual(Buffer.compare(
                newFileBuffer,
                Buffer.concat([NodeID3.create(tags), buffer])
            ), 0)
        })
        it('async write file with id3 tag', function (done) {
            fs.writeFileSync(filepath, bufferWithTag, 'binary')
            NodeID3.write(tags, filepath, function () {
                let newFileBuffer = fs.readFileSync(filepath)
                fs.unlinkSync(filepath)
                if (Buffer.compare(
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

    describe('#read()', function () {
        it('read empty id3 tag', function () {
            let frame = NodeID3.create({})
            assert.deepStrictEqual(
                NodeID3.read(frame),
                { raw: {} }
            )
        })

        it('read text frames id3 tag', function () {
            let frame = NodeID3.create({ title: "asdfghjÄÖP", album: "naBGZwssg" })
            assert.deepStrictEqual(
                NodeID3.read(frame),
                { title: "asdfghjÄÖP", album: "naBGZwssg", raw: { TIT2: "asdfghjÄÖP", TALB: "naBGZwssg" } }
            )
        })

        it('read tag with broken frame', function () {
            let frame = NodeID3.create({ title: "asdfghjÄÖP", album: "naBGZwssg" })
            frame[10] = 0x99
            assert.deepStrictEqual(
                NodeID3.read(frame),
                { album: "naBGZwssg", raw: { TALB: "naBGZwssg" } }
            )
        })

        /*it('read tag with broken tag', function() {
            let frame = NodeID3.create({ title: "asdfghjÄÖP", album: "naBGZwssg" })
            frame[3] = 0x99
            assert.deepStrictEqual(
                NodeID3.read(frame),
                { raw: { }}
            )
        })*/

        it('read tag with bigger size', function () {
            let frame = NodeID3.create({ title: "asdfghjÄÖP", album: "naBGZwssg" })
            frame[9] += 100
            assert.deepStrictEqual(
                NodeID3.read(frame),
                { title: "asdfghjÄÖP", album: "naBGZwssg", raw: { TIT2: "asdfghjÄÖP", TALB: "naBGZwssg" } }
            )
        })

        it('read tag with smaller size', function () {
            let frame = NodeID3.create({ title: "asdfghjÄÖP", album: "naBGZwssg" })
            frame[9] -= 25
            assert.deepStrictEqual(
                NodeID3.read(frame),
                { title: "asdfghjÄÖP", raw: { TIT2: "asdfghjÄÖP" } }
            )
        })

        it('read TXXX frame', function () {
            let tags = { userDefinedText: { description: "abc", value: "deg" } }
            let frame = NodeID3.create(tags)
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

        it('read TXXX array frame', function () {
            let tags = { userDefinedText: [{ description: "abc", value: "deg" }, { description: "abcd", value: "efgh" }] }
            let frame = NodeID3.create(tags)
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

        it('read APIC frame', function () {
            let withAll = Buffer.from("4944330300000000101C4150494300000016000000696D6167652F6A7065670003617364660061626364", "hex")
            let noDesc = Buffer.from("494433030000000000264150494300000012000000696D6167652F6A70656700030061626364", "hex")
            let obj = {
                description: "asdf",
                imageBuffer: Buffer.from([0x61, 0x62, 0x63, 0x64]),
                mime: "image/jpeg",
                type: { id: 3, name: "front cover" }
            }

            assert.deepStrictEqual(
                NodeID3.read(withAll).image,
                obj
            )

            obj.description = undefined
            assert.deepStrictEqual(
                NodeID3.read(noDesc).image,
                obj
            )
        })

        it('read USLT frame', function () {
            let frameBuf = Buffer.from('4944330300000000006E55534C5400000064000001646575FFFE48006100690077007300E400E40023000000FFFE610073006B00640068002000610073006800640020006F006C00610068007300200065006C006F0077007A00200064006C006F0075006100690073006800200064006B0061006A006800', 'hex')
            const unsynchronisedLyrics = {
                language: "deu",
                shortText: "Haiwsää#",
                text: "askdh ashd olahs elowz dlouaish dkajh"
            }

            assert.deepStrictEqual(
                NodeID3.read(frameBuf).unsynchronisedLyrics,
                unsynchronisedLyrics
            )
        })

        it('read COMM frame', function () {
            let frameBuf = Buffer.from('4944330300000000006E434F4D4D00000064000001646575FFFE48006100690077007300E400E40023000000FFFE610073006B00640068002000610073006800640020006F006C00610068007300200065006C006F0077007A00200064006C006F0075006100690073006800200064006B0061006A006800', 'hex')
            const comment = {
                language: "deu",
                shortText: "Haiwsää#",
                text: "askdh ashd olahs elowz dlouaish dkajh"
            }

            assert.deepStrictEqual(
                NodeID3.read(frameBuf).comment,
                comment
            )
        })

        it('read POPM frame', function () {
            let frameBuf = Buffer.from('49443303000000000020504F504D0000001600006D61696C406578616D706C652E636F6D00C00000000C', 'hex')
            const popularimeter = {
                email: "mail@example.com",
                rating: 192,  // 1-255
                counter: 12
            }

            assert.deepStrictEqual(
                NodeID3.read(frameBuf).popularimeter,
                popularimeter
            )
        })

        it('read PRIV frame', function () {
            let frameBuf = Buffer.from('4944330300000000003250524956000000140000416243006173646F61687764696F686177646177505249560000000A000041624353535300010205', 'hex')
            const priv = [{
                ownerIdentifier: "AbC",
                data: Buffer.from("asdoahwdiohawdaw")
            }, {
                ownerIdentifier: "AbCSSS",
                data: Buffer.from([0x01, 0x02, 0x05])
            }]

            assert.deepStrictEqual(
                NodeID3.read(frameBuf).private,
                priv
            )
        })

        it("read UFID frame", function () {
            let frameBuf = Buffer.from('4944330300000000001e55464944000000140000416243006173646f61687764696f686177646177', 'hex');
            const ufid = [
                {
                    ownerIdentifier: "AbC",
                    identifier: "asdoahwdiohawdaw"
                }
            ];

            assert.deepStrictEqual(NodeID3.read(frameBuf).uniqueFileIdentifier, ufid);
        });



        it('read CHAP frame', function () {
            let frameBuf = Buffer.from('494433030000000000534348415000000049000048657921000000138800001F400000007B000001C8544954320000000F000001FFFE6100620063006400650066005450453100000011000001FFFE61006B0073006800640061007300', 'hex')
            const chap = [{
                elementID: "Hey!", //THIS MUST BE UNIQUE!
                startTimeMs: 5000,
                endTimeMs: 8000,
                startOffsetBytes: 123, // OPTIONAL!
                endOffsetBytes: 456,   // OPTIONAL!
                tags: {                // OPTIONAL
                    title: "abcdef",
                    artist: "akshdas",
                    raw: {
                        TIT2: "abcdef",
                        TPE1: "akshdas"
                    }
                }
            }]

            assert.deepStrictEqual(
                NodeID3.read(frameBuf).chapter,
                chap
            )
        })

        it('read WXXX frame', function () {
            const frameBuf = Buffer.from('4944330300000000002c5758585800000022000001fffe61006200630064002300000068747470733a2f2f6578616d706c652e636f6d', 'hex')
            const userDefinedUrl = [{
                description: 'abcd#',
                url: 'https://example.com'
            }]

            assert.deepStrictEqual(
                NodeID3.read(frameBuf).userDefinedUrl,
                userDefinedUrl
            )
        })

        it('read URL frame', function () {
            const frameBuf = Buffer.from('4944330300000000003d57434f4d0000001400000068747470733a2f2f6578616d706c652e636f6d574f41460000001500000068747470733a2f2f6578616d706c65322e636f6d', 'hex')
            const commercialUrl = ['https://example.com']
            const fileUrl = 'https://example2.com'

            assert.deepStrictEqual(
                NodeID3.read(frameBuf).commercialUrl,
                commercialUrl
            )
            assert.deepStrictEqual(
                NodeID3.read(frameBuf).fileUrl,
                fileUrl
            )
        })

        it('read exclude', function () {
            let tags = {
                TIT2: "abcdeÜ看板かんばん",
                album: "nasÖÄkdnasd",
                year: "1990"
            }

            const buffer = NodeID3.create(tags)
            let read = NodeID3.read(buffer, { exclude: ['TIT2'] })
            delete read.raw
            delete tags.TIT2
            assert.deepStrictEqual(
                read,
                tags
            )
        })

        it('read include', function () {
            let tags = {
                title: "abcdeÜ看板かんばん",
                album: "nasÖÄkdnasd",
                year: "1990"
            }

            const buffer = NodeID3.create(tags)
            let read = NodeID3.read(buffer, { include: ['TALB', 'TIT2'] })
            delete read.raw
            delete tags.year
            assert.deepStrictEqual(
                read,
                tags
            )
        })

        it('onlyRaw', function () {
            let tags = {
                TIT2: "abcdeÜ看板かんばん",
                TALB: "nasÖÄkdnasd"
            }

            const buffer = NodeID3.create(tags)
            let read = NodeID3.read(buffer, { onlyRaw: true })
            assert.deepStrictEqual(
                read,
                tags
            )
        })

        it('noRaw', function () {
            let tags = {
                title: "abcdeÜ看板かんばん",
                album: "nasÖÄkdnasd"
            }

            const buffer = NodeID3.create(tags)
            let read = NodeID3.read(buffer, { noRaw: true })
            assert.deepStrictEqual(
                read,
                tags
            )
        })
    })
})

describe('ID3 helper functions', function () {
    describe('#removeTagsFromBuffer()', function () {
        it('no tags in buffer', function () {
            let emptyBuffer = Buffer.from([0x12, 0x04, 0x05, 0x01, 0x76, 0x27, 0x76, 0x27, 0x76, 0x27, 0x76, 0x27])
            assert.strictEqual(Buffer.compare(
                emptyBuffer,
                NodeID3.removeTagsFromBuffer(emptyBuffer)
            ), 0)
        })

        it('tags at start', function () {
            let buffer = Buffer.from([0x22, 0x73, 0x72])
            let bufferWithID3 = Buffer.concat([
                NodeID3.create({ title: "abc" }),
                buffer
            ])
            assert.strictEqual(Buffer.compare(
                NodeID3.removeTagsFromBuffer(bufferWithID3),
                buffer
            ), 0)
        })

        it('tags in middle/end', function () {
            let buffer = Buffer.from([0x22, 0x73, 0x72])
            let bufferWithID3 = Buffer.concat([
                buffer,
                NodeID3.create({ title: "abc" }),
                buffer
            ])
            assert.strictEqual(Buffer.compare(
                NodeID3.removeTagsFromBuffer(bufferWithID3),
                Buffer.concat([buffer, buffer])
            ), 0)
        })
    })
})

const nodeTagsFull = {
    title: 'abc',
    album: '人物asfjas as das \\',
    comment: {
        language: 'en3',
        shortText: 'asd物f',
        text: 1337
    },
    unsynchronisedLyrics: {
        language: 'e33',
        shortText: 'asd物f',
        text: 'asd物f asd物f asd物f'
    },
    userDefinedText: [
        {
            description: "txxx name物",
            value: "TXXX value text"
        }, {
            description: "txxx name 2",
            value: "TXXX value text 2"
        }
    ],
    image: {
        mime: "jpeg",
        description: 'asd物f asd物f asd物f',
        imageBuffer: Buffer.from([0x02, 0x27, 0x17, 0x99])
    },
    popularimeter: {
        email: 'test@example.com',
        rating: 192,
        counter: 12
    },
    private: [{
        ownerIdentifier: "AbC",
        data: "asdoahwdiohawdaw"
    }, {
        ownerIdentifier: "AbCSSS",
        data: Buffer.from([0x01, 0x02, 0x05])
    }],
    chapter: [{
        elementID: "Hey!", // THIS MUST BE UNIQUE!
        startTimeMs: 5000,
        endTimeMs: 8000,
        startOffsetBytes: 123, // OPTIONAL!
        endOffsetBytes: 456,   // OPTIONAL!
        tags: {                // OPTIONAL
            title: "abcdef",
            artist: "akshdas"
        }
    }],
    tableOfContents: [{
        elementID: "toc1",    // THIS MUST BE UNIQUE!
        isOrdered: false,     // OPTIONAL, tells a player etc. if elements are in a specific order
        elements: ['chap1'],  // OPTIONAL but most likely needed, contains the chapter/tableOfContents elementIDs
        tags: {               // OPTIONAL
            title: "abcdef"
        }
    }],
    commercialUrl: ["commercialurl.com"],
    userDefinedUrl: [{
        description: "URL description物",
        url: "https://example.com/"
    }]
}

const nodeTagsMissingValues = {
    comment: {
        language: 'en3',
        text: 1337
    },
    userDefinedText: [
        {
            value: "TXXX value text"
        }, {
            value: "TXXX value text 2"
        }
    ],
    image: {
        mime: "jpeg",
        imageBuffer: Buffer.from([0x02, 0x27, 0x17, 0x99])
    },
    popularimeter: {
        email: 'test@example.com',
        counter: 12
    },
    private: [{
        data: "asdoahwdiohawdaw"
    }, {
        data: Buffer.from([0x01, 0x02, 0x05])
    }],
    chapter: [{
        elementID: "Hey!", // THIS MUST BE UNIQUE!
        startTimeMs: 5000,
        endTimeMs: 8000
    }],
    tableOfContents: [{
        elementID: "toc1",    // THIS MUST BE UNIQUE!
        elements: ['chap1']
    }],
}

describe('Cross tests jsmediatags', function () {
    it('write full', function () {
        jsmediatags.read(NodeID3.create(nodeTagsFull), {
            onSuccess: (tag) => {
                const tags = tag.tags
                assert.strictEqual(tags.TIT2.data, nodeTagsFull.title)
                assert.strictEqual(tags.TALB.data, nodeTagsFull.album)
                assert.deepStrictEqual({ language: tags.COMM.data.language, shortText: tags.COMM.data.short_description, text: parseInt(tags.COMM.data.text) }, nodeTagsFull.comment)
                assert.deepStrictEqual({ language: tags.USLT.data.language, shortText: tags.USLT.data.descriptor, text: tags.USLT.data.lyrics }, nodeTagsFull.unsynchronisedLyrics)
                expect(tags.TXXX.map((t) => {
                    return {
                        description: t.data.user_description,
                        value: t.data.data
                    }
                })).to.have.deep.members(nodeTagsFull.userDefinedText)
                assert.deepStrictEqual({
                    mime: tags.APIC.data.format,
                    description: tags.APIC.data.description,
                    imageBuffer: Buffer.from(tags.APIC.data.data)
                }, nodeTagsFull.image)
                /* POPM seems broken in jsmediatags, data is null but tag looks correct */
                /* PRIV seems broken in jsmediatags, data is null but tag looks correct */
                assert.deepStrictEqual({
                    elementID: nodeTagsFull.chapter[0].elementID,
                    startTimeMs: tags.CHAP.data.startTime,
                    endTimeMs: tags.CHAP.data.endTime,
                    startOffsetBytes: tags.CHAP.data.startOffset,
                    endOffsetBytes: tags.CHAP.data.endOffset,
                    tags: {
                        title: tags.CHAP.data.subFrames.TIT2.data,
                        artist: tags.CHAP.data.subFrames.TPE1.data
                    }
                }, nodeTagsFull.chapter[0])
                assert.deepStrictEqual({
                    elementID: nodeTagsFull.tableOfContents[0].elementID,
                    isOrdered: false,
                    elements: tags.CTOC.data.childElementIds,
                    tags: {
                        title: tags.CTOC.data.subFrames.TIT2.data
                    }
                }, nodeTagsFull.tableOfContents[0])
                assert.strictEqual(tags.WCOM.data, nodeTagsFull.commercialUrl[0])
                assert.deepStrictEqual({
                    description: tags.WXXX.data.user_description,
                    url: nodeTagsFull.userDefinedUrl[0].url /* The URL is always encoded with ISO-8859-1 => jsmediatags reads as UTF-16, can't use here*/
                }, nodeTagsFull.userDefinedUrl[0])
            },
            onError: function (error) {
                throw error
            }
        })
    })

    it('write with missing values', function () {
        jsmediatags.read(NodeID3.create(nodeTagsMissingValues), {
            onSuccess: (tag) => {
                const tags = tag.tags
                assert.deepStrictEqual({ language: tags.COMM.data.language, text: parseInt(tags.COMM.data.text) }, nodeTagsMissingValues.comment)
                assert.strictEqual(tags.COMM.data.short_description, '')
                expect(tags.TXXX.map((t) => {
                    return {
                        value: t.data.data
                    }
                })).to.have.deep.members(nodeTagsMissingValues.userDefinedText)
                tags.TXXX.forEach((t) => {
                    assert.strictEqual(t.data.user_description, '')
                })
                assert.deepStrictEqual({
                    mime: tags.APIC.data.format,
                    imageBuffer: Buffer.from(tags.APIC.data.data)
                }, nodeTagsMissingValues.image)
                assert.strictEqual(tags.APIC.data.description, '')
                /* POPM seems broken in jsmediatags, data is null but tag looks correct */
                /* PRIV seems broken in jsmediatags, data is null but tag looks correct */
                assert.deepStrictEqual({
                    elementID: nodeTagsMissingValues.chapter[0].elementID,
                    startTimeMs: tags.CHAP.data.startTime,
                    endTimeMs: tags.CHAP.data.endTime
                }, nodeTagsMissingValues.chapter[0])
                assert.deepStrictEqual(tags.CHAP.data.subFrames, {})
                assert.strictEqual(tags.CHAP.data.startOffset, 0xFFFFFFFF)
                assert.strictEqual(tags.CHAP.data.endOffset, 0xFFFFFFFF)
                assert.deepStrictEqual({
                    elementID: nodeTagsMissingValues.tableOfContents[0].elementID,
                    elements: tags.CTOC.data.childElementIds,
                }, nodeTagsMissingValues.tableOfContents[0])
                assert.deepStrictEqual(tags.CTOC.data.subFrames, {})
                assert.strictEqual(tags.CTOC.data.ordered, false)
            },
            onError: function (error) {
                throw error
            }
        })
    })

    it('read from full self-created tags', function () {
        const tagsBuffer = NodeID3.create(nodeTagsFull)
        let read = NodeID3.read(tagsBuffer)

        delete read.raw
        delete read.chapter[0].tags.raw
        delete read.tableOfContents[0].tags.raw
        read.comment.text = parseInt(read.comment.text)
        delete read.image.type
        read.private[0].data = read.private[0].data.toString()
        if (!read.unsynchronisedLyrics.shortText) delete read.unsynchronisedLyrics.shortText
        assert.deepStrictEqual(nodeTagsFull, read)
    })

    it('read from missing values self-created tags', function () {
        const tagsBuffer = NodeID3.create(nodeTagsMissingValues)
        let read = NodeID3.read(tagsBuffer)

        delete read.raw
        assert.deepStrictEqual(read.chapter[0].tags.raw, {})
        delete read.chapter[0].tags
        read.comment.text = parseInt(read.comment.text)
        if (!read.comment.shortText) delete read.comment.shortText
        if (!read.image.description) delete read.image.description
        delete read.image.type
        assert.strictEqual(read.popularimeter.rating, 0)
        delete read.popularimeter.rating
        read.private[0].data = read.private[0].data.toString()
        if (read.private[0].ownerIdentifier === undefined) delete read.private[0].ownerIdentifier
        if (read.private[1].ownerIdentifier === undefined) delete read.private[1].ownerIdentifier
        assert.strictEqual(read.tableOfContents[0].isOrdered, false)
        assert.deepStrictEqual(read.tableOfContents[0].tags.raw, {})
        delete read.tableOfContents[0].tags
        delete read.tableOfContents[0].isOrdered
        if (!read.userDefinedText[0].description) delete read.userDefinedText[0].description
        if (!read.userDefinedText[1].description) delete read.userDefinedText[1].description
        assert.deepStrictEqual(nodeTagsMissingValues, read)
    })
})

function sizeToBuffer(totalSize) {
    let buffer = Buffer.alloc(4)
    buffer.writeUInt32BE(totalSize)
    return buffer
}
