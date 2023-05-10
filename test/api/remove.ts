import * as NodeID3 from '../../index'
import assert = require('assert')
import chai = require('chai')
import * as fs from 'fs'

describe('NodeID3 API', function () {
    describe('#removeTags()', function() {
        const nonExistingFilepath = './hopefully-does-not-exist.mp3'
        it('sync not existing filepath', function() {
            chai.assert.isFalse(fs.existsSync(nonExistingFilepath))
            chai.assert.instanceOf(
                NodeID3.removeTags(nonExistingFilepath), Error
            )
        })
        it('async not existing filepath', function() {
            chai.assert.isFalse(fs.existsSync(nonExistingFilepath))
            NodeID3.removeTags(nonExistingFilepath, function(err) {
                if(!(err instanceof Error)) {
                    assert.fail('No error thrown on non-existing filepath')
                }
            })
        })

        const titleTag = {
            title: 'title'
        } satisfies NodeID3.WriteTags
        const filepath = './testfile.mp3'

        describe('valid buffer', function() {
            const prefixBuffer = Buffer.from([0x01, 0x02, 0x03])
            const postfixBuffer = Buffer.from([0x04, 0x05, 0x06])
            const buffer = Buffer.concat([
                prefixBuffer,
                NodeID3.create(titleTag),
                postfixBuffer
            ])
            const bufferAfterRemove = Buffer.concat([
                prefixBuffer,
                postfixBuffer
            ])

            beforeEach(function() {
                fs.writeFileSync(filepath, buffer)
            })

            afterEach(function() {
                fs.unlinkSync(filepath)
            })

            it('sync remove tags from file', function() {
                NodeID3.removeTags(filepath)
                assert.deepStrictEqual(
                    fs.readFileSync(filepath),
                    bufferAfterRemove
                )
            })

            it('async remove tags from file', function(done) {
                NodeID3.removeTags(filepath, (err) => {
                    assert.equal(err, null)
                    assert.deepStrictEqual(
                        fs.readFileSync(filepath),
                        bufferAfterRemove
                    )
                    done()
                })
            })
        })
    })
})
