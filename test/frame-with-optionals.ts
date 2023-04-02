import * as NodeID3 from '../index'
import assert = require('assert')

const createAndRead = (frames: NodeID3.WriteTags) =>
    NodeID3.read(NodeID3.create(frames), {noRaw: true})

describe('Frames with optional values', function () {
    it('comment frame', function () {
        assert.deepStrictEqual(createAndRead({
            comment: {
                language: 'eng',
                text: 'comment text'
            },
        }), {
            comment: {
                language: 'eng',
                shortText: '',
                text: 'comment text'
            }
        })
    })
    it('userDefinedText frame', function() {
        assert.deepStrictEqual(createAndRead({
            userDefinedText: [{
                value: "TXXX value text"
            }, {
                value: "TXXX value text 2"
            }]
        }), {
            userDefinedText: [{
                description: '',
                value: "TXXX value text"
            }, {
                description: '',
                value: "TXXX value text 2"
            }]
        })
    })
    it('image frame', function() {
        assert.deepStrictEqual(createAndRead({
            image: {
                mime: "image/jpeg",
                imageBuffer: Buffer.from([0x02, 0x27, 0x17, 0x99])
            }
        }), {
            image: {
                description: "",
                mime: "image/jpeg",
                type: {
                    id: NodeID3.TagConstants.AttachedPicture.PictureType.FRONT_COVER,
                    name: "front cover"
                },
                imageBuffer: Buffer.from([0x02, 0x27, 0x17, 0x99])
            },
        })
    })
    it('private frame', function() {
        assert.deepStrictEqual(createAndRead({
            private: [{
                data: Buffer.from("private-buffer")
            }, {
                data: Buffer.from([0x01, 0x02, 0x05])
            }],
        }), {
            private: [{
                ownerIdentifier: '',
                data: Buffer.from("private-buffer")
            }, {
                ownerIdentifier: '',
                data: Buffer.from([0x01, 0x02, 0x05])
            }],

        })
    }),
    it('chapter frame', function() {
        assert.deepStrictEqual(createAndRead({
            chapter: [{
                elementID: "chapter 1",
                startTimeMs: 5000,
                endTimeMs: 8000
            }],
        }), {
            chapter: [{
                elementID: "chapter 1",
                startTimeMs: 5000,
                endTimeMs: 8000,
                tags: { raw: {} }
            }],
        })
    }),
    it('tableOfContents frame', function() {
        assert.deepStrictEqual(createAndRead({
            tableOfContents: [{
                elementID: "toc 1",
                elements: ['chap1']
            }],
        }), {
            tableOfContents: [{
                elementID: "toc 1",
                elements: ['chap1'],
                isOrdered: false,
                tags: { raw: {} }
            }],
        })
    })
})
