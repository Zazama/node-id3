import * as NodeID3 from '../index'
import assert = require('assert')

/**
 * Some characters to test unicode encoding.
 */
const unicodeTestCharacters = "-äé"

describe('NodeID3 frames', function () {
    it('read() matches create()', function () {
        const TagConstants = NodeID3.TagConstants
        const tags = {
            /**
             * COMM
             */
            comment: {
                language: "eng",
                shortText: "Short content descriptor" + unicodeTestCharacters,
                text: "Actual comment text" + unicodeTestCharacters
            },
            /**
             * CHAP
             */
            chapter: [{
                elementID: "chapter-1", // This must be unique
                startTimeMs: 5000,
                endTimeMs: 8000,
                tags: { raw: {} }
            }, {
                elementID: "chapter-2",
                startTimeMs: 5000,
                endTimeMs: 8000,
                startOffsetBytes: 123, // Optional
                endOffsetBytes: 456,   // Optional
                tags: {                // Optional
                    title: "title" + unicodeTestCharacters,
                    artist: "artist" + unicodeTestCharacters,
                    raw: {
                        TIT2: "title" + unicodeTestCharacters,
                        TPE1: "artist" + unicodeTestCharacters
                    }
                }
            }],
            /**
             * ETCO
             */
            eventTimingCodes: {
                timeStampFormat: TagConstants.TimeStampFormat.MPEG_FRAMES,
                keyEvents: [{
                    type: TagConstants.EventTimingCodes.EventType.END_OF_INITIAL_SILENCE,
                    timeStamp: 1000
                }, {
                    type: TagConstants.EventTimingCodes.EventType.OUTRO_END, timeStamp: 1337
                }]
            },
            /**
             * UFID
             */
            uniqueFileIdentifier: [{
                ownerIdentifier: "owner-id-1" + unicodeTestCharacters,
                identifier: Buffer.from("identifier-1")
            }, {
                ownerIdentifier: "owner-id-2" + unicodeTestCharacters,
                identifier: Buffer.from("identifier-2")
            }],
            /**
             * USLT
             */
            unsynchronisedLyrics: {
                language: "eng",
                shortText: "Content descriptor" +  unicodeTestCharacters,
                text: "some lyrics text" + unicodeTestCharacters
            },
            /**
             * SYLT
             */
            synchronisedLyrics: [{
                language: "eng",
                timeStampFormat: TagConstants.TimeStampFormat.MILLISECONDS,
                contentType: TagConstants.SynchronisedLyrics.ContentType.LYRICS,
                shortText: "Content descriptor" + unicodeTestCharacters,
                synchronisedText: [{
                    text: "some words" + unicodeTestCharacters,
                    timeStamp: 0
                    }, {
                    text: "more words" + unicodeTestCharacters,
                    timeStamp: 1000
                }]
            }],
            /**
             * TXXX
             */
            userDefinedText: [{
                description: "description",
                value: "value"
            }],
            /**
             * POPM
             */
            popularimeter: {
                email: "mail@example.com",
                rating: 192,  // 1-255
                counter: 123
            },
            /**
             * PRIV
             */
            private: [{
                ownerIdentifier: "owner-id-1",
                data: Buffer.from("data-from-string")
            }, {
                ownerIdentifier: "owner-id-2",
                data: Buffer.from([0x01, 0x02, 0x05])
            }],
            /**
             * WCOM
             */
            commercialUrl: [
                "https://commercial-1.com",
                "https://commercial-2.com"
            ],
            /**
             * WCOP
             */
            copyrightUrl: 'https://copyright.com',
            /**
             * WOAF
             */
            fileUrl: "https://audio-file.com",
            /**
             * WOAR
             */
            artistUrl: [
                "https://artist-1.com",
                "https://artist-2.com"
            ],
            /**
             * WOAS
             */
            audioSourceUrl: "https://audio-source.com",
            /**
             * WORS
             */
            radioStationUrl: "https://radio-station.com",
            /**
             * WPAY
             */
            paymentUrl: "https://payment.com",
            /**
             * WPUB
             */
            publisherUrl: "https://publisher.com",
            /**
             * WXXX
             */
            userDefinedUrl: [{
                description: 'url-description',
                url: 'https://example.com'
            }]
        } satisfies NodeID3.Tags
        const createdBuffer = NodeID3.create(tags)
        const readTags = NodeID3.read(createdBuffer, { noRaw: true})
        assert.deepStrictEqual(tags, readTags)
    })
})
