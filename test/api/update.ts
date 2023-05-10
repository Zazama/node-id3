import * as NodeID3 from '../../index'
import assert = require('assert')
import chai = require('chai')
import * as fs from 'fs'

describe('NodeID3 API', function () {
    describe('#update()', function() {
        const titleTag = {
            title: 'title'
        } satisfies NodeID3.WriteTags
        const albumTag = {
            album: 'album'
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
            NodeID3.update(albumTag, filepath, (error) => {
                chai.assert.isNull(error)
                assert.deepStrictEqual(
                    NodeID3.read(filepath, {noRaw: true}),
                    tags
                )
                done()
            })
        })

        // TODO: Remove in new API release
        it('update compare key is respected when available', function() {
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

            // userDefinedText should update the value because of equal descriptions.
            // private frame does not have an update compare key specified,
            // which is why the new one is added next to the old.
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
