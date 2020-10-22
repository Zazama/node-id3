const NodeID3 = require('../index.js');
const assert = require('assert');
const iconv = require('iconv-lite');
const fs = require('fs');

describe('NodeID3', function () {
    describe('#create()', function () {
        it('empty tags', function () {
            assert.equal(NodeID3.create({}).compare(Buffer.from([0x49, 0x44, 0x33, 0x03, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00])), 0);
        });
        it('text frames', function () {
            let tags = {
                TIT2: "abcdeÜ看板かんばん",
                album: "nasÖÄkdnasd",
                notfound: "notfound"
            };
            let buffer = NodeID3.create(tags);
            let titleSize = 10 + 1 + iconv.encode(tags.TIT2, 'utf16').length;
            let albumSize = 10 + 1 + iconv.encode(tags.album, 'utf16').length;
            assert.equal(buffer.length,
                10 + // ID3 frame header
                titleSize + // TIT2 header + encoding byte + utf16 bytes + utf16 string
                albumSize // same as above for album
            );
            // Check ID3 header
            assert.ok(buffer.includes(
                Buffer.concat([
                    Buffer.from([0x49, 0x44, 0x33, 0x03, 0x00, 0x00]),
                    Buffer.from(NodeID3.encodeSize(titleSize + albumSize))
                ])
            ));

            // Check TIT2 frame
            assert.ok(buffer.includes(
                Buffer.concat([
                    Buffer.from([0x54, 0x49, 0x54, 0x32]),
                    sizeToBuffer(titleSize - 10),
                    Buffer.from([0x00, 0x00]),
                    Buffer.from([0x01]),
                    iconv.encode(tags.TIT2, 'utf16')
                ])
            ));
            // Check album frame
            assert.ok(buffer.includes(
                Buffer.concat([
                    Buffer.from([0x54, 0x41, 0x4C, 0x42]),
                    sizeToBuffer(albumSize - 10),
                    Buffer.from([0x00, 0x00]),
                    Buffer.from([0x01]),
                    iconv.encode(tags.album, 'utf16')
                ])
            ));
        });

        it('user defined text frames', function() {
            let tags = {
                userDefinedText: {
                    description: "abc",
                    value: "defg"
                }
            };
            let buffer = NodeID3.create(tags).slice(10);
            let descEncoded = iconv.encode(tags.userDefinedText.description + "\0", "UTF-16");
            let valueEncoded = iconv.encode(tags.userDefinedText.value, "UTF-16");

            assert.equal(Buffer.compare(
                buffer,
                Buffer.concat([
                    Buffer.from([0x54, 0x58, 0x58, 0x58]),
                    sizeToBuffer(1 + descEncoded.length + valueEncoded.length),
                    Buffer.from([0x00, 0x00]),
                    Buffer.from([0x01]),
                    descEncoded,
                    valueEncoded
                ])
            ), 0);

            tags = {
                userDefinedText: [{
                    description: "abc",
                    value: "defg"
                }, {
                    description: "hij",
                    value: "klmn"
                }]
            };
            buffer = NodeID3.create(tags).slice(10);
            let desc1Encoded = iconv.encode(tags.userDefinedText[0].description + "\0", "UTF-16");
            let value1Encoded = iconv.encode(tags.userDefinedText[0].value, "UTF-16");
            let desc2Encoded = iconv.encode(tags.userDefinedText[1].description + "\0", "UTF-16");
            let value2Encoded = iconv.encode(tags.userDefinedText[1].value, "UTF-16");

            assert.equal(Buffer.compare(
                buffer,
                Buffer.concat([
                    Buffer.from([0x54, 0x58, 0x58, 0x58]),
                    sizeToBuffer(1 + desc2Encoded.length + value2Encoded.length),
                    Buffer.from([0x00, 0x00]),
                    Buffer.from([0x01]),
                    desc2Encoded,
                    value2Encoded,
                    Buffer.from([0x54, 0x58, 0x58, 0x58]),
                    sizeToBuffer(1 + desc1Encoded.length + value1Encoded.length),
                    Buffer.from([0x00, 0x00]),
                    Buffer.from([0x01]),
                    desc1Encoded,
                    value1Encoded
                ])
            ), 0);
        });

        it('create APIC frame', function() {
            let tags = {
                image: {
                    description: "asdf",
                    imageBuffer: Buffer.from('5B307836312C20307836322C20307836332C20307836345D', 'hex'),
                    mime: "image/jpeg",
                    type: {id: 3, name: "front cover"}
                }
            };

            assert.equal(Buffer.compare(
                NodeID3.create(tags),
                Buffer.from('4944330300000000003B4150494300000031000001696D6167652F6A7065670003FFFE610073006400660000005B307836312C20307836322C20307836332C20307836345D', 'hex')
            ), 0);

            assert.equal(Buffer.compare(
                NodeID3.create({
                    image: __dirname + '/smallimg'
                }),
                NodeID3.create({
                    image: {
                        imageBuffer: fs.readFileSync(__dirname + '/smallimg')
                    }
                })
            ), 0)

            assert.equal(Buffer.compare(
                NodeID3.create({
                    image: fs.readFileSync(__dirname + '/smallimg')
                }),
                NodeID3.create({
                    image: {
                        imageBuffer: fs.readFileSync(__dirname + '/smallimg')
                    }
                })
            ), 0)
        });

        it('create USLT frame', function() {
            let tags = {
                unsynchronisedLyrics: {
                    language: "deu",
                    shortText: "Haiwsää#",
                    text: "askdh ashd olahs elowz dlouaish dkajh"
                }
            };

            assert.equal(Buffer.compare(
                NodeID3.create(tags),
                Buffer.from('4944330300000000006E55534C5400000064000001646575FFFE48006100690077007300E400E40023000000FFFE610073006B00640068002000610073006800640020006F006C00610068007300200065006C006F0077007A00200064006C006F0075006100690073006800200064006B0061006A006800', 'hex')
            ), 0);
        });

        it('create COMM frame', function() {
            const tags = {
                comment: {
                    language: "deu",
                    shortText: "Haiwsää#",
                    text: "askdh ashd olahs elowz dlouaish dkajh"
                }
            };
            let frameBuf = Buffer.from('4944330300000000006E434F4D4D00000064000001646575FFFE48006100690077007300E400E40023000000FFFE610073006B00640068002000610073006800640020006F006C00610068007300200065006C006F0077007A00200064006C006F0075006100690073006800200064006B0061006A006800', 'hex');

            assert.equal(Buffer.compare(
                NodeID3.create(tags),
                frameBuf
            ), 0);
        });

        it('create POPM frame', function() {
            let frameBuf = Buffer.from('49443303000000000020504F504D0000001600006D61696C406578616D706C652E636F6D00C00000000C', 'hex');
            const tags = {
                popularimeter: {
                    email: "mail@example.com",
                    rating: 192,  // 1-255
                    counter: 12
                }
            };

            assert.equal(Buffer.compare(
                NodeID3.create(tags),
                frameBuf
            ), 0);
        });

        it('create PRIV frame', function() {
            let frameBuf = Buffer.from('4944330300000000003250524956000000140000416243006173646F61687764696F686177646177505249560000000A000041624353535300010205', 'hex');
            const tags = { PRIV: [{
                    ownerIdentifier: "AbC",
                    data: Buffer.from("asdoahwdiohawdaw")
                }, {
                    ownerIdentifier: "AbCSSS",
                    data: Buffer.from([0x01, 0x02, 0x05])
                }]
            };

            assert.deepEqual(
                NodeID3.create(tags),
                frameBuf
            );
        });

        it('create CHAP frame', function() {
            let frameBuf = Buffer.from('494433030000000000534348415000000049000048657921000000138800001F400000007B000001C8544954320000000F000001FFFE6100620063006400650066005450453100000011000001FFFE61006B0073006800640061007300', 'hex');
            const tags = { CHAP: [{
                    elementID: "Hey!", //THIS MUST BE UNIQUE!
                    startTimeMs: 5000,
                    endTimeMs: 8000,
                    startOffsetBytes: 123, // OPTIONAL!
                    endOffsetBytes: 456,   // OPTIONAL!
                    tags: {                // OPTIONAL
                        title: "abcdef",
                        artist: "akshdas"
                    }
                }]};

            assert.deepEqual(
                NodeID3.create(tags),
                frameBuf
            );
        });
    });

    describe('#write()', function() {
        it('sync not existing filepath', function() {
            assert.throws(NodeID3.write.bind({}, './hopefullydoesnotexist.mp3'), Error);
        });
        it('async not existing filepath', function() {
            NodeID3.write({}, './hopefullydoesnotexist.mp3', function(err) {
                if(!(err instanceof Error)) {
                    assert.fail("No error thrown on non-existing filepath");
                }
            });
        });

        let buffer = Buffer.from([0x02, 0x06, 0x12, 0x22]);
        let tags = {title: "abc"};
        let filepath = './testfile.mp3';

        it('sync write file without id3 tag', function() {
            fs.writeFileSync(filepath, buffer, 'binary');
            NodeID3.write(tags, filepath);
            let newFileBuffer = fs.readFileSync(filepath);
            fs.unlinkSync(filepath);
            assert.equal(Buffer.compare(
                newFileBuffer,
                Buffer.concat([NodeID3.create(tags), buffer])
            ), 0);
        });
        it('async write file without id3 tag', function(done) {
            fs.writeFileSync(filepath, buffer, 'binary');
            NodeID3.write(tags, filepath, function() {
                let newFileBuffer = fs.readFileSync(filepath);
                fs.unlinkSync(filepath);
                if(Buffer.compare(
                    newFileBuffer,
                    Buffer.concat([NodeID3.create(tags), buffer])
                ) === 0) {
                    done();
                } else {
                    done(new Error("buffer not the same"))
                }
            });
        });

        let bufferWithTag = Buffer.concat([NodeID3.create(tags), buffer]);
        tags = {album: "ix123"};

        it('sync write file with id3 tag', function() {
            fs.writeFileSync(filepath, bufferWithTag, 'binary');
            NodeID3.write(tags, filepath);
            let newFileBuffer = fs.readFileSync(filepath);
            fs.unlinkSync(filepath);
            assert.equal(Buffer.compare(
                newFileBuffer,
                Buffer.concat([NodeID3.create(tags), buffer])
            ), 0);
        });
        it('async write file with id3 tag', function(done) {
            fs.writeFileSync(filepath, bufferWithTag, 'binary');
            NodeID3.write(tags, filepath, function() {
                let newFileBuffer = fs.readFileSync(filepath);
                fs.unlinkSync(filepath);
                if(Buffer.compare(
                    newFileBuffer,
                    Buffer.concat([NodeID3.create(tags), buffer])
                ) === 0) {
                    done();
                } else {
                    done(new Error("file written incorrectly"));
                }
            });
        });
    });

    describe('#read()', function() {
        it('read empty id3 tag', function() {
            let frame = NodeID3.create({});
            assert.deepEqual(
                NodeID3.read(frame),
                {raw: {}}
            );
        });

        it('read text frames id3 tag', function() {
            let frame = NodeID3.create({ title: "asdfghjÄÖP", album: "naBGZwssg" });
            assert.deepEqual(
                NodeID3.read(frame),
                { title: "asdfghjÄÖP", album: "naBGZwssg", raw: { TIT2: "asdfghjÄÖP", TALB: "naBGZwssg" }}
            );
        });

        it('read tag with broken frame', function() {
            let frame = NodeID3.create({ title: "asdfghjÄÖP", album: "naBGZwssg" });
            frame[10] = 0x99;
            assert.deepEqual(
                NodeID3.read(frame),
                { album: "naBGZwssg", raw: { TALB: "naBGZwssg" }}
            );
        });

        /*it('read tag with broken tag', function() {
            let frame = NodeID3.create({ title: "asdfghjÄÖP", album: "naBGZwssg" });
            frame[3] = 0x99;
            assert.deepEqual(
                NodeID3.read(frame),
                { raw: { }}
            );
        });*/

        it('read tag with bigger size', function() {
            let frame = NodeID3.create({ title: "asdfghjÄÖP", album: "naBGZwssg" });
            frame[9] += 100;
            assert.deepEqual(
                NodeID3.read(frame),
                { title: "asdfghjÄÖP", album: "naBGZwssg", raw: { TIT2: "asdfghjÄÖP", TALB: "naBGZwssg" }}
            );
        });

        it('read tag with smaller size', function() {
            let frame = NodeID3.create({ title: "asdfghjÄÖP", album: "naBGZwssg" });
            frame[9] -= 25;
            assert.deepEqual(
                NodeID3.read(frame),
                { title: "asdfghjÄÖP", raw: { TIT2: "asdfghjÄÖP" }}
            );
        });

        it('read TXXX frame', function() {
            let tags = { userDefinedText: {description: "abc", value: "deg"} };
            let frame = NodeID3.create(tags);
            assert.deepEqual(
                NodeID3.read(frame),
                {
                    userDefinedText: [tags.userDefinedText],
                    raw: {
                        TXXX: [tags.userDefinedText]
                    }
                }
            );
        });

        it('read TXXX array frame', function() {
            let tags = { userDefinedText: [{description: "abc", value: "deg"}, {description: "abcd", value: "efgh"}] };
            let frame = NodeID3.create(tags);
            assert.deepEqual(
                NodeID3.read(frame),
                {
                    userDefinedText: [tags.userDefinedText[1], tags.userDefinedText[0]],
                    raw: {
                        TXXX: [tags.userDefinedText[1], tags.userDefinedText[0]]
                    }
                }
            );
        });

        it('read APIC frame', function() {
            let withAll = Buffer.from("4944330300000000101C4150494300000016000000696D6167652F6A7065670003617364660061626364", "hex");
            let noDesc = Buffer.from("494433030000000000264150494300000012000000696D6167652F6A70656700030061626364", "hex");
            let obj = {
                description: "asdf",
                imageBuffer: Buffer.from([0x61, 0x62, 0x63, 0x64]),
                mime: "jpeg",
                type: { id: 3, name: "front cover" }
            };

            assert.deepEqual(
                NodeID3.read(withAll).image,
                obj
            );

            obj.description = undefined;
            assert.deepEqual(
                NodeID3.read(noDesc).image,
                obj
            );
        });

        it('read USLT frame', function() {
            let frameBuf = Buffer.from('4944330300000000006E55534C5400000064000001646575FFFE48006100690077007300E400E40023000000FFFE610073006B00640068002000610073006800640020006F006C00610068007300200065006C006F0077007A00200064006C006F0075006100690073006800200064006B0061006A006800', 'hex');
            const unsynchronisedLyrics = {
                language: "deu",
                shortText: "Haiwsää#",
                text: "askdh ashd olahs elowz dlouaish dkajh"
            };

            assert.deepEqual(
                NodeID3.read(frameBuf).unsynchronisedLyrics,
                unsynchronisedLyrics
            );
        });

        it('read COMM frame', function() {
            let frameBuf = Buffer.from('4944330300000000006E434F4D4D00000064000001646575FFFE48006100690077007300E400E40023000000FFFE610073006B00640068002000610073006800640020006F006C00610068007300200065006C006F0077007A00200064006C006F0075006100690073006800200064006B0061006A006800', 'hex');
            const comment = {
                language: "deu",
                shortText: "Haiwsää#",
                text: "askdh ashd olahs elowz dlouaish dkajh"
            };

            assert.deepEqual(
                NodeID3.read(frameBuf).comment,
                comment
            );
        });

        it('read POPM frame', function() {
            let frameBuf = Buffer.from('49443303000000000020504F504D0000001600006D61696C406578616D706C652E636F6D00C00000000C', 'hex');
            const popularimeter = {
                email: "mail@example.com",
                rating: 192,  // 1-255
                counter: 12
            };

            assert.deepEqual(
                NodeID3.read(frameBuf).popularimeter,
                popularimeter
            );
        });

        it('read PRIV frame', function() {
            let frameBuf = Buffer.from('4944330300000000003250524956000000140000416243006173646F61687764696F686177646177505249560000000A000041624353535300010205', 'hex');
            const priv = [{
                ownerIdentifier: "AbC",
                data: Buffer.from("asdoahwdiohawdaw")
            }, {
                ownerIdentifier: "AbCSSS",
                data: Buffer.from([0x01, 0x02, 0x05])
            }];

            assert.deepEqual(
                NodeID3.read(frameBuf).private,
                priv
            );
        });

        it('read CHAP frame', function() {
            let frameBuf = Buffer.from('494433030000000000534348415000000049000048657921000000138800001F400000007B000001C8544954320000000F000001FFFE6100620063006400650066005450453100000011000001FFFE61006B0073006800640061007300', 'hex');
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
            }];

            assert.deepEqual(
                NodeID3.read(frameBuf).chapter,
                chap
            );
        });
    });
});

describe('ID3 helper functions', function () {
    describe('#removeTagsFromBuffer()', function () {
        it('no tags in buffer', function () {
            let emptyBuffer = Buffer.from([0x12, 0x04, 0x05, 0x01, 0x76, 0x27, 0x76, 0x27, 0x76, 0x27, 0x76, 0x27]);
            assert.equal(Buffer.compare(
                emptyBuffer,
                NodeID3.removeTagsFromBuffer(emptyBuffer)
            ), 0);
        });

        it('tags at start', function () {
            let buffer = Buffer.from([0x22, 0x73, 0x72]);
            let bufferWithID3 = Buffer.concat([
                NodeID3.create({title: "abc"}),
                buffer
            ]);
            assert.equal(Buffer.compare(
                NodeID3.removeTagsFromBuffer(bufferWithID3),
                buffer
            ), 0);
        });

        it('tags in middle/end', function () {
            let buffer = Buffer.from([0x22, 0x73, 0x72]);
            let bufferWithID3 = Buffer.concat([
                buffer,
                NodeID3.create({title: "abc"}),
                buffer
            ]);
            assert.equal(Buffer.compare(
                NodeID3.removeTagsFromBuffer(bufferWithID3),
                Buffer.concat([buffer, buffer])
            ), 0);
        });
    });
});

function sizeToBuffer(totalSize) {
    let buffer = Buffer.alloc(4);
    buffer.writeUInt32BE(totalSize);
    return buffer;
}
