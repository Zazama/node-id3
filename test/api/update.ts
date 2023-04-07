import * as NodeID3 from '../../index'
import assert = require('assert')
import chai = require('chai')
import * as fs from 'fs'
import { WriteCallback } from '../../index'

describe('NodeID3 API', function () {
    describe('#update()', function() {
        const titleTag = {
            title: "abc"
        } satisfies NodeID3.WriteTags
        const albumTag = {
            album: "def"
        }
        const tags = {...titleTag, ...albumTag}
        const filepath = './testfile.mp3'

        beforeEach(function() {
            fs.writeFileSync(filepath, NodeID3.create(titleTag))
        })

        it('sync add tag to existing', function() {
            chai.assert.isTrue(NodeID3.update(albumTag, filepath))
            assert.deepStrictEqual(
                NodeID3.read(filepath, {noRaw: true}),
                tags
            )
        })

        it('async add tag to existing', function(done) {
            NodeID3.update(albumTag, filepath, (error, data) => {
                chai.assert.isNull(error)
                assert.deepStrictEqual(
                    NodeID3.read(filepath, {noRaw: true}),
                    tags
                )
                done()
            })
        })

        it('compare key', function() {
            const beforeTags = {
                userDefinedText: [{
                    description: 'description',
                    value: 'some value'
                }],
                private: [{
                    ownerIdentifier: 'ownerIdentifier',
                    data: Buffer.from('data')
                }]
            } satisfies NodeID3.Tags
            const addTags = {
                userDefinedText: [{
                    description: 'description',
                    value: 'some other value'
                }],
                private: {
                    ownerIdentifier: 'ownerIdentifier',
                    data: Buffer.from('data2')
                }
            } satisfies NodeID3.Tags
            const afterTags = {
                userDefinedText: addTags.userDefinedText,
                private: [...beforeTags.private, addTags.private]
            } satisfies NodeID3.Tags
            const beforeBuffer = NodeID3.create(beforeTags)
            const afterBuffer = NodeID3.update(addTags, beforeBuffer)

            assert.deepStrictEqual(
                NodeID3.read(afterBuffer, {noRaw: true}),
                afterTags
            )
        })

        afterEach(function() {
            fs.unlinkSync(filepath)
        })
    })
})