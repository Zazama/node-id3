import * as NodeID3 from '../index'
import assert = require('assert')
import { expect } from 'chai'
import { createId3Tag } from '../src/id3-tag'
import { FrameBuilder } from '../src/FrameBuilder'
import { Frames } from '../src/frames/frames'

describe('Frames with errors', function () {
    it('reading an invalid private frame throws', function() {
        const invalidPrivateFrameBuffer = new FrameBuilder('PRIV').getBuffer()
        const readInvalidFrame =
            () => Frames['PRIV'].read(invalidPrivateFrameBuffer)
        expect(readInvalidFrame).to.throw()
    }),
    it('a frame with a decode error is ignored', function () {
        const invalidPrivateFrame = new FrameBuilder('PRIV').getBufferWithPartialHeader()
        const id3Data = createId3Tag(invalidPrivateFrame)
        const readFrames = NodeID3.read(id3Data, {noRaw: true})
        assert.deepStrictEqual(readFrames, {})
    })
})
