const NodeID3 = require('../index')
const jsmediatags = require("jsmediatags")
const assert = require('assert')
const chai = require('chai')
const expect = chai.expect

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

describe('Cross tests jsmediatags', function() {
    it('write full', function() {
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
                    elementID:nodeTagsFull.tableOfContents[0].elementID,
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
            onError: function(error) {
                throw error
            }
        })
    })

    it('write with missing values', function() {
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
            onError: function(error) {
                throw error
            }
        })
    })

    it('read from full self-created tags', function() {
        const tagsBuffer = NodeID3.create(nodeTagsFull)
        const read = NodeID3.read(tagsBuffer)

        delete read.raw
        delete read.chapter[0].tags.raw
        delete read.tableOfContents[0].tags.raw
        read.comment.text = parseInt(read.comment.text)
        delete read.image.type
        read.private[0].data = read.private[0].data.toString()
        if(!read.unsynchronisedLyrics.shortText) delete read.unsynchronisedLyrics.shortText
        assert.deepStrictEqual(nodeTagsFull, read)
    })

    it('read from missing values self-created tags', function() {
        const tagsBuffer = NodeID3.create(nodeTagsMissingValues)
        const read = NodeID3.read(tagsBuffer)

        delete read.raw
        assert.deepStrictEqual(read.chapter[0].tags.raw, {})
        delete read.chapter[0].tags
        read.comment.text = parseInt(read.comment.text)
        if(!read.comment.shortText) delete read.comment.shortText
        if(!read.image.description) delete read.image.description
        delete read.image.type
        assert.strictEqual(read.popularimeter.rating, 0)
        delete read.popularimeter.rating
        read.private[0].data = read.private[0].data.toString()
        if(read.private[0].ownerIdentifier === undefined) delete read.private[0].ownerIdentifier
        if(read.private[1].ownerIdentifier === undefined) delete read.private[1].ownerIdentifier
        assert.strictEqual(read.tableOfContents[0].isOrdered, false)
        assert.deepStrictEqual(read.tableOfContents[0].tags.raw, {})
        delete read.tableOfContents[0].tags
        delete read.tableOfContents[0].isOrdered
        if(!read.userDefinedText[0].description) delete read.userDefinedText[0].description
        if(!read.userDefinedText[1].description) delete read.userDefinedText[1].description
        assert.deepStrictEqual(nodeTagsMissingValues, read)
    })
})

