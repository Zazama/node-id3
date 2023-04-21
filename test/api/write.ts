import * as NodeID3 from '../../index'
import { expect } from 'chai'
import * as fs from 'fs'
import { unlinkIfExistSync } from '../../src/util-file'
import { createTestBuffer } from '../util'

describe('NodeID3.write()', function () {
    const nonExistingFilepath = './hopefully-does-not-exist.mp3'
    const testFilepath = './write-test-file.mp3'
    beforeEach(function () {
        unlinkIfExistSync(nonExistingFilepath)
        unlinkIfExistSync(testFilepath)
    })
    afterEach(function() {
        unlinkIfExistSync(nonExistingFilepath)
        unlinkIfExistSync(testFilepath)
    })
    it('sync creates a file when non-existing', function() {
        NodeID3.write({}, nonExistingFilepath)
        expect(fs.existsSync(nonExistingFilepath)).to.be.true
    })
    it('async creates a file when non-existing', function(done) {
        NodeID3.write({}, nonExistingFilepath, function(error) {
            if (error) {
                done(new Error("Unexpected error"))
            } else {
                expect(fs.existsSync(nonExistingFilepath)).to.be.true
                done()
            }
        })
    })

    const data = createTestBuffer(256)
    const tag = NodeID3.create({ album: "album"})
    const newFrame = { title: "title "} satisfies NodeID3.WriteTags
    const newTag = NodeID3.create(newFrame)

    type TestCase = [
        // Name
        string,
        // Input data
        readonly Buffer[] | null,
        // Expected data
        readonly Buffer[],
        // File buffer size
        number | null
    ]
    const testCases: TestCase[] = [
        [
            "without file",
            null, [newTag], null
        ],
        [
            "without tag (buffer.length > data.length)",
            [data], [newTag, data], data.length + 1
        ],
        [
            "without tag (buffer.length === data.length)",
            [data], [newTag, data], data.length / 2
        ],
        [
            "without tag (buffer.length < data.length)",
            [data], [newTag, data], data.length - 1
        ],
        [
            "with same tag",
            [newTag, data], [newTag, data], newTag.length - 1
        ],
        [
            "with tag at the start",
            [tag, data], [newTag, data], tag.length - 1
        ],
        [
            "with tag in the middle (ID3 identifier crossover)",
            [data, tag, data], [newTag, data, data], data.length + 1
        ],
        [
            "with tag in the middle (at ID3 identifier position)",
            [data, tag, data], [newTag, data, data], data.length
        ],
        [
            "with tag in the middle (before ID3 identifier position)",
            [data, tag, data], [newTag, data, data], data.length - 1
        ],
        [
            "with multiple tags",
            [data, tag, data, tag, data], [newTag, data, data, data], data.length - 1
        ],
        [
            "with multiple tags (buffer smaller than tag)",
            [data, tag, data, tag, data], [newTag, data, data, data], tag.length - 1
        ],
        [
            "with multiple tags (2nd tag across reads)",
            [data, tag, tag, data], [newTag, data, data], data.length
        ],
        [
            "w/ multiple tags (2nd tag across reads, buffer smalller than tag)",
            [data, tag, tag, data], [newTag, data, data], tag.length - 1
        ],
        [
            "with tag at the end",
            [data, tag], [newTag, data], data.length - 1
        ],
    ]

    testCases.forEach(
        ([caseName, inputBuffers, expectedBuffers, fileBufferSize]) => {
        const options = fileBufferSize ? { fileBufferSize } : {}
        const inputBuffer = inputBuffers ? Buffer.concat(inputBuffers) : null
        const expectedBuffer = Buffer.concat(expectedBuffers)
        it(`sync write ${caseName}`, function() {
            if (inputBuffer) {
                fs.writeFileSync(testFilepath, inputBuffer, 'binary')
            }
            NodeID3.writeInFileSync(newFrame, testFilepath, options)
            const newFileBuffer = fs.readFileSync(testFilepath)
            expect(newFileBuffer).to.deep.equal(expectedBuffer)
        })
        it(`async write ${caseName}`, function(done) {
            if (inputBuffer) {
                fs.writeFileSync(testFilepath, inputBuffer, 'binary')
            }
            NodeID3.writeInFile(
                newFrame, testFilepath, options, (error) => {
                    if (error) {
                        done(error)
                        return
                    }
                    const newFileBuffer = fs.readFileSync(testFilepath)
                    expect(newFileBuffer).to.deep.equal(expectedBuffer)
                    done()
                }
            )
        })
    })
})
