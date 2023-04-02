import { FrameOptions, FRAME_OPTIONS } from './definitions/FrameOptions'
import { isKeyOf } from './util'

export function getFrameOptions(frameIdentifier: string): FrameOptions {
    if (isKeyOf(frameIdentifier, FRAME_OPTIONS)) {
        return FRAME_OPTIONS[frameIdentifier]
    }
    return {
        multiple: false
    }
}

export function processUnsynchronisedBuffer(buffer: Buffer) {
    const newDataArr = []
    if (buffer.length > 0) {
        newDataArr.push(buffer[0])
    }
    for(let i = 1; i < buffer.length; i++) {
        if (buffer[i - 1] === 0xFF && buffer[i] === 0x00) {
            continue
        }
        newDataArr.push(buffer[i])
    }
    return Buffer.from(newDataArr)
}
