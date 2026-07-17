const assert = require('assert')
const fs = require('fs')
const NodeID3 = require('../index.js')

function synchronisedLyrics(shortText, timeStamp) {
    return {
        language: 'eng',
        timeStampFormat: NodeID3.TagConstants.TimeStampFormat.MILLISECONDS,
        contentType: NodeID3.TagConstants.SynchronisedLyrics.ContentType.LYRICS,
        shortText,
        synchronisedText: [{ text: shortText, timeStamp }]
    }
}

describe('NodeID3 frame update options', function() {
    const oldLyrics = synchronisedLyrics('Old lyrics', 1000)
    const newLyrics = synchronisedLyrics('New lyrics', 2000)
    const audio = Buffer.from([0xFF, 0xFB, 0x90, 0x64, 0x01, 0x02, 0x03])
    const filepath = './frame-update-test.mp3'

    afterEach(function() {
        if(fs.existsSync(filepath)) {
            fs.unlinkSync(filepath)
        }
    })

    describe('frame behavior', function() {
        it('retains the existing merge behavior by default', function() {
        const original = NodeID3.create({ synchronisedLyrics: [oldLyrics] })
        const updated = NodeID3.update({ synchronisedLyrics: [newLyrics] }, original)

        assert.deepStrictEqual(NodeID3.read(updated).synchronisedLyrics, [oldLyrics, newLyrics])
        })

        it('replaces all instances while preserving unrelated frames and audio', function() {
        const image = {
            mime: 'image/png',
            type: { id: NodeID3.TagConstants.AttachedPicture.FRONT_COVER },
            description: 'cover',
            imageBuffer: Buffer.from([0x89, 0x50, 0x4E, 0x47])
        }
        const privateFrame = { ownerIdentifier: 'owner', data: Buffer.from([1, 2, 3]) }
        const original = Buffer.concat([NodeID3.create({
            title: 'Title',
            image,
            private: [privateFrame],
            synchronisedLyrics: [oldLyrics, synchronisedLyrics('Older lyrics', 500)]
        }), audio])

        const updated = NodeID3.update(
            { synchronisedLyrics: [newLyrics] },
            original,
            { replaceFrames: ['SYLT', 'SYLT'] }
        )
        const read = NodeID3.read(updated)

        assert.deepStrictEqual(read.synchronisedLyrics, [newLyrics])
        assert.strictEqual(read.title, 'Title')
        assert.deepStrictEqual(read.image.imageBuffer, image.imageBuffer)
        assert.deepStrictEqual(read.private, [privateFrame])
        assert.deepStrictEqual(updated.subarray(updated.length - audio.length), audio)
        })

        it('removes frames and gives removal precedence over supplied tags', function() {
        const original = NodeID3.create({
            title: 'Title',
            synchronisedLyrics: [oldLyrics]
        })
        const updated = NodeID3.update(
            { synchronisedLyrics: [newLyrics] },
            original,
            { removeFrames: ['SYLT'] }
        )
        const read = NodeID3.read(updated)

        assert.strictEqual(read.synchronisedLyrics, undefined)
        assert.strictEqual(read.title, 'Title')
        })

        it('leaves a replacement frame unchanged when no value is supplied', function() {
        const original = NodeID3.create({ synchronisedLyrics: [oldLyrics] })
        const updated = NodeID3.update({}, original, { replaceFrames: ['SYLT'] })

        assert.deepStrictEqual(NodeID3.read(updated).synchronisedLyrics, [oldLyrics])
        })
    })

    describe('API forms', function() {
        it('supports callback updates with buffers', function(done) {
        const original = NodeID3.create({ synchronisedLyrics: [oldLyrics] })

        NodeID3.update(
            { synchronisedLyrics: [newLyrics] },
            original,
            { replaceFrames: ['SYLT'] },
            function(error, updated) {
                if(error) {
                    done(error)
                    return
                }
                assert.deepStrictEqual(NodeID3.read(updated).synchronisedLyrics, [newLyrics])
                done()
            }
        )
        })

        it('supports synchronous and callback updates with filepaths', function(done) {
        fs.writeFileSync(filepath, NodeID3.create({ synchronisedLyrics: [oldLyrics] }))
        assert.strictEqual(NodeID3.update({}, filepath, { removeFrames: ['SYLT'] }), true)
        assert.strictEqual(NodeID3.read(filepath).synchronisedLyrics, undefined)

        NodeID3.update(
            { synchronisedLyrics: [newLyrics] },
            filepath,
            { replaceFrames: ['SYLT'] },
            function(error) {
                if(error) {
                    done(error)
                    return
                }
                assert.deepStrictEqual(NodeID3.read(filepath).synchronisedLyrics, [newLyrics])
                done()
            }
        )
        })

        it('supports promise updates', function() {
        const original = NodeID3.create({ synchronisedLyrics: [oldLyrics] })
        return NodeID3.Promise.update(
            { synchronisedLyrics: [newLyrics] },
            original,
            { replaceFrames: ['SYLT'] }
        ).then((updated) => {
            assert.deepStrictEqual(NodeID3.read(updated).synchronisedLyrics, [newLyrics])
        })
        })
    })

    describe('option validation', function() {
        it('rejects invalid option values synchronously', function() {
        const invalidOptions = [
            { replaceFrames: 'SYLT' },
            { removeFrames: [1234] },
            { replaceFrames: ['sylt'] },
            { removeFrames: ['SYL'] },
            { replaceFrames: ['SYLT'], removeFrames: ['SYLT'] }
        ]

        invalidOptions.forEach((options) => {
            assert.throws(() => NodeID3.update({}, Buffer.alloc(0), options), TypeError)
        })
        })

        it('reports invalid options to callbacks', function(done) {
        NodeID3.update({}, Buffer.alloc(0), { removeFrames: ['bad'] }, function(error) {
            assert(error instanceof TypeError)
            done()
        })
        })

        it('rejects promises for invalid options', function() {
        return assert.rejects(
            NodeID3.Promise.update({}, Buffer.alloc(0), { replaceFrames: ['SYLT'], removeFrames: ['SYLT'] }),
            TypeError
        )
        })
    })
})
