import * as NodeID3 from '../index'
import assert = require('assert')

describe('ID3 helper functions', function () {
    describe('#removeTagsFromBuffer()', function () {
        it('no tags in buffer', function () {
            const emptyBuffer = Buffer.from(
                [0x12, 0x04, 0x05, 0x01, 0x76, 0x27, 0x76, 0x27, 0x76, 0x27, 0x76, 0x27]
            )

            assert.strictEqual(Buffer.compare(
                NodeID3.removeTagsFromBuffer(emptyBuffer) as Buffer,
                emptyBuffer
            ), 0)
        })

        it('tags at start', function () {
            const buffer = Buffer.from([0x22, 0x73, 0x72])
            const bufferWithID3 = Buffer.concat([
                NodeID3.create({title: "title"}),
                buffer
            ])
            assert.strictEqual(Buffer.compare(
                NodeID3.removeTagsFromBuffer(bufferWithID3) as Buffer,
                buffer
            ), 0)
        })

        it('tags in middle/end', function () {
            const buffer = Buffer.from([0x22, 0x73, 0x72])
            const bufferWithID3 = Buffer.concat([
                buffer,
                NodeID3.create({title: "title"}),
                buffer
            ])
            assert.strictEqual(Buffer.compare(
                NodeID3.removeTagsFromBuffer(bufferWithID3) as Buffer,
                Buffer.concat([buffer, buffer])
            ), 0)
        })
    })
})
