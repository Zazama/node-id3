const assert = require('assert')
const fs = require('fs')
const NodeID3 = require('../index')

function createVersion10Tag() {
    const tag = Buffer.alloc(128)
    tag.write('TAG', 0, 'ascii')
    tag.write('  Title  ', 3, 'latin1')
    tag.write('Artist', 33, 'latin1')
    tag.write('Album', 63, 'latin1')
    tag.write('1999', 93, 'latin1')
    tag.write('A thirty byte comment value!!', 97, 'latin1')
    tag[127] = 17
    return tag
}

describe('ID3v1', function() {
    const audio = Buffer.from([0xFF, 0xFB, 0x90, 0x64, 0x54, 0x41, 0x47, 0x01])
    const filepath = './id3v1-test-file.mp3'

    afterEach(function() {
        if(fs.existsSync(filepath)) fs.unlinkSync(filepath)
    })

    describe('#readId3v1()', function() {
        it('reads ID3v1.0 without trimming leading spaces', function() {
            assert.deepStrictEqual(NodeID3.readId3v1(Buffer.concat([audio, createVersion10Tag()])), {
                version: '1.0',
                title: '  Title',
                artist: 'Artist',
                album: 'Album',
                year: '1999',
                comment: 'A thirty byte comment value!!',
                genreId: 17
            })
        })

        it('reads ID3v1.1 with a zero track byte as version 1.1', function() {
            const buffer = NodeID3.writeId3v1({ title: 'Title', trackNumber: 0 }, audio)
            assert.deepStrictEqual(NodeID3.readId3v1(buffer), {
                version: '1.1',
                title: 'Title'
            })
        })

        it('returns null for short buffers and internal TAG bytes', function() {
            assert.strictEqual(NodeID3.readId3v1(Buffer.from('TAG')), null)
            assert.strictEqual(NodeID3.readId3v1(audio), null)
        })
    })

    describe('#writeId3v1()', function() {
        it('writes maximum-width fields and exact layout', function() {
            const tag = {
                title: 't'.repeat(30),
                artist: 'a'.repeat(30),
                album: 'b'.repeat(30),
                year: '2026',
                comment: 'c'.repeat(28),
                trackNumber: 255,
                genreId: 147,
                version: '1.0'
            }
            const output = NodeID3.writeId3v1(tag, audio)
            const suffix = output.slice(-128)
            assert.strictEqual(output.length, audio.length + 128)
            assert.strictEqual(suffix.slice(0, 3).toString('ascii'), 'TAG')
            assert.strictEqual(suffix.slice(3, 33).toString('latin1'), tag.title)
            assert.strictEqual(suffix.slice(33, 63).toString('latin1'), tag.artist)
            assert.strictEqual(suffix.slice(63, 93).toString('latin1'), tag.album)
            assert.strictEqual(suffix.slice(93, 97).toString('latin1'), tag.year)
            assert.strictEqual(suffix.slice(97, 125).toString('latin1'), tag.comment)
            assert.deepStrictEqual([...suffix.slice(125)], [0, 255, 147])
        })

        it('null-pads short values and replaces/truncates lossy text', function() {
            const output = NodeID3.writeId3v1({
                title: `caf\u00e9\u{1F3B5}${'x'.repeat(30)}`,
                comment: 'a\0b'
            }, audio)
            const suffix = output.slice(-128)
            assert.strictEqual(suffix.slice(3, 33).toString('latin1'), `caf\u00e9?${'x'.repeat(25)}`)
            assert.strictEqual(suffix.slice(97, 100).toString('latin1'), 'ab\0')
            assert.ok(suffix.slice(100, 125).every((value) => value === 0))
        })

        it('rejects lossy and overlong fields in error mode', function() {
            assert.throws(() => NodeID3.writeId3v1({ title: 'music \u{1F3B5}' }, audio, {
                id3v1Truncation: 'error'
            }), TypeError)
            assert.throws(() => NodeID3.writeId3v1({ title: 'x'.repeat(31) }, audio, {
                id3v1Truncation: 'error'
            }), RangeError)
            assert.throws(() => NodeID3.writeId3v1({ comment: 'a\0b' }, audio, {
                id3v1Truncation: 'error'
            }), TypeError)
            const widths = { title: 30, artist: 30, album: 30, year: 4, comment: 28 }
            Object.keys(widths).forEach((field) => {
                const tag = {}
                tag[field] = 'x'.repeat(widths[field] + 1)
                assert.throws(() => NodeID3.writeId3v1(tag, audio, {
                    id3v1Truncation: 'error'
                }), RangeError)
            })
        })

        it('strictly validates direct track, genre, and option values', function() {
            assert.throws(() => NodeID3.writeId3v1({ trackNumber: '3' }, audio), TypeError)
            assert.throws(() => NodeID3.writeId3v1({ trackNumber: 256 }, audio), RangeError)
            assert.throws(() => NodeID3.writeId3v1({ genreId: -1 }, audio), RangeError)
            assert.throws(() => NodeID3.writeId3v1({}, audio, { id3v1Truncation: 'clip' }), TypeError)
            assert.strictEqual(NodeID3.readId3v1(NodeID3.writeId3v1({ trackNumber: 1 }, audio)).trackNumber, 1)
        })

        it('replaces exactly one trailing tag', function() {
            const first = NodeID3.writeId3v1({ title: 'First' }, audio)
            const second = NodeID3.writeId3v1({ title: 'Second' }, first)
            assert.strictEqual(second.length, first.length)
            assert.strictEqual(NodeID3.readId3v1(second).title, 'Second')
            assert.deepStrictEqual(second.slice(0, audio.length), audio)
        })
    })

    describe('#removeId3v1()', function() {
        it('is byte-identical when no trailing tag exists', function() {
            assert.deepStrictEqual(NodeID3.removeId3v1(audio), audio)
        })

        it('removes the trailing tag without removing ID3v2', function() {
            const id3v2 = NodeID3.write({ title: 'Title' }, audio)
            const source = NodeID3.writeId3v1({ title: 'Title' }, id3v2)
            const result = NodeID3.removeId3v1(source)
            assert.strictEqual(NodeID3.read(result).title, 'Title')
            assert.deepStrictEqual(NodeID3.removeTagsFromBuffer(result), audio)
        })
    })

    describe('filepath, callback, and Promise APIs', function() {
        it('supports synchronous filepath write, update, read, and removal', function() {
            fs.writeFileSync(filepath, audio)
            assert.strictEqual(NodeID3.write({ title: 'Initial', artist: 'Artist' }, filepath), true)
            assert.strictEqual(NodeID3.update({ title: 'Updated' }, filepath), true)
            assert.strictEqual(NodeID3.writeId3v1({ title: 'Updated', artist: 'Artist' }, filepath), true)
            assert.deepStrictEqual(NodeID3.readId3v1(filepath), {
                version: '1.1', title: 'Updated', artist: 'Artist'
            })
            assert.strictEqual(NodeID3.removeId3v1(filepath), true)
            assert.strictEqual(NodeID3.readId3v1(filepath), null)
            assert.strictEqual(NodeID3.read(filepath).title, 'Updated')
        })

        it('does not change a filepath when error-mode validation fails', function() {
            fs.writeFileSync(filepath, audio)
            const result = NodeID3.writeId3v1({ title: '\u{1F3B5}' }, filepath, {
                id3v1Truncation: 'error'
            })
            assert.ok(result instanceof TypeError)
            assert.deepStrictEqual(fs.readFileSync(filepath), audio)
        })

        it('supports options and results in callbacks', function(done) {
            NodeID3.write({ title: 'Title' }, audio, (error, buffer) => {
                assert.ifError(error)
                NodeID3.writeId3v1({ title: 'Title' }, buffer, (error, buffer) => {
                    assert.ifError(error)
                    NodeID3.readId3v1(buffer, (error, tag) => {
                        assert.ifError(error)
                        assert.strictEqual(tag.title, 'Title')
                        NodeID3.removeId3v1(buffer, (error, result) => {
                            assert.ifError(error)
                            assert.strictEqual(NodeID3.readId3v1(result), null)
                            done()
                        })
                    })
                })
            })
        })

        it('supports dedicated Promise APIs and write options', function() {
            return NodeID3.Promise.writeId3v1({ title: 'Direct' }, audio)
                .then((written) => NodeID3.Promise.readId3v1(written).then((tag) => {
                    assert.strictEqual(tag.title, 'Direct')
                    return NodeID3.Promise.removeId3v1(written)
                }))
                .then((removed) => {
                    assert.deepStrictEqual(removed, audio)
                    return NodeID3.Promise.write({ title: 'ID3v2' }, audio)
                })
                .then((id3v2) => NodeID3.Promise.writeId3v1({ title: 'Separate' }, id3v2))
                .then((result) => {
                    assert.strictEqual(NodeID3.readId3v1(result).title, 'Separate')
                })
        })
    })
})
