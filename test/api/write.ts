import * as NodeID3 from '../../index'
import { expect } from 'chai'
import * as fs from 'fs'
import { unlinkIfExistSync } from '../../src/util-file'
import { promisify } from 'util'

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

    const titleFrame = { title: "title "} satisfies NodeID3.WriteTags
    const data = Buffer.from([0x02, 0x06, 0x12, 0x22])
    const titleTag = NodeID3.create(titleFrame)
    const albumTag = NodeID3.create({ album: "album" })
    const titleTagThenData = Buffer.concat([titleTag, data])
    const dataThenTitleTag = Buffer.concat([data, titleTag])
    const albumTagThenData = Buffer.concat([albumTag, data])

    const testCases = [
        ["without file", null, titleTag],
        ["file without id3 tag", data, titleTagThenData],
        ["file with same id3 tag", titleTagThenData, titleTagThenData],
        ["file with id3 tag after data", dataThenTitleTag, titleTagThenData],
        ["file with different id3 tag", albumTagThenData, titleTagThenData],
    ] as const

    testCases.forEach(([caseName, inputBuffer, expectedBuffer]) => {
        it(`sync write ${caseName}`, function() {
            if (inputBuffer) {
                fs.writeFileSync(testFilepath, inputBuffer, 'binary')
            }
            NodeID3.write(titleFrame, testFilepath)
            const newFileBuffer = fs.readFileSync(testFilepath)
            if (Buffer.compare(newFileBuffer, expectedBuffer)) {
                console.log("newFileBuffer:", newFileBuffer)
                console.log("expectedBuffer:", expectedBuffer)
            }
            expect(
                Buffer.compare(newFileBuffer, expectedBuffer)
            ).to.equal(0)
        })
        it(`async write ${caseName}`, async function() {
            if (inputBuffer) {
                fs.writeFileSync(testFilepath, inputBuffer, 'binary')
            }
            const write = promisify(NodeID3.write)
            await write(titleFrame, testFilepath)
            const newFileBuffer = fs.readFileSync(testFilepath)
            if (Buffer.compare(newFileBuffer, expectedBuffer)) {
                console.log("newFileBuffer:", newFileBuffer)
                console.log("expectedBuffer:", expectedBuffer)
            }
            expect(
                Buffer.compare(newFileBuffer, expectedBuffer)
            ).to.equal(0)
        })
    })
})
