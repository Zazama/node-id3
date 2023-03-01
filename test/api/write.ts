import * as NodeID3 from '../../index'
import assert = require('assert')
import chai = require('chai')
import * as fs from 'fs'

describe('NodeID3 API', function () {
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
        const titleTag = {
            title: "abc"
        } satisfies NodeID3.WriteTags
        const filepath = './testfile.mp3'

        it('sync write file without id3 tag', function() {
            fs.writeFileSync(filepath, buffer, 'binary')
            NodeID3.write(titleTag, filepath)
            const newFileBuffer = fs.readFileSync(filepath)
            fs.unlinkSync(filepath)
            assert.strictEqual(Buffer.compare(
                newFileBuffer,
                Buffer.concat([NodeID3.create(titleTag), buffer])
            ), 0)
        })

        it('async write file without id3 tag', function(done) {
            fs.writeFileSync(filepath, buffer, 'binary')
            NodeID3.write(titleTag, filepath, function() {
                const newFileBuffer = fs.readFileSync(filepath)
                fs.unlinkSync(filepath)
                if(Buffer.compare(
                    newFileBuffer,
                    Buffer.concat([NodeID3.create(titleTag), buffer])
                ) === 0) {
                    done()
                } else {
                    done(new Error("buffer not the same"))
                }
            })
        })

        {

        const bufferWithTag = Buffer.concat([NodeID3.create(titleTag), buffer])
        const albumTag = {
            album: "ix123"
        } satisfies NodeID3.WriteTags

        it('sync write file with id3 tag', function() {
            fs.writeFileSync(filepath, bufferWithTag, 'binary')
            NodeID3.write(albumTag, filepath)
            const newFileBuffer = fs.readFileSync(filepath)
            fs.unlinkSync(filepath)
            assert.strictEqual(Buffer.compare(
                newFileBuffer,
                Buffer.concat([NodeID3.create(albumTag), buffer])
            ), 0)
        })
        it('async write file with id3 tag', function(done) {
            fs.writeFileSync(filepath, bufferWithTag, 'binary')
            NodeID3.write(albumTag, filepath, function() {
                const newFileBuffer = fs.readFileSync(filepath)
                fs.unlinkSync(filepath)
                if(Buffer.compare(
                    newFileBuffer,
                    Buffer.concat([NodeID3.create(albumTag), buffer])
                ) === 0) {
                    done()
                } else {
                    done(new Error("file written incorrectly"))
                }
            })
        })
    }
    })
})
