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

export function parseTagHeaderFlags(header: Buffer) {
    if (!(header instanceof Buffer && header.length >= 10)) {
        return {}
    }
    const version = header[3]
    const flagsByte = header[5]
    if (version === 3) {
        return {
            unsynchronisation: !!(flagsByte & 128),
            extendedHeader: !!(flagsByte & 64),
            experimentalIndicator: !!(flagsByte & 32)
        }
    }
    if (version === 4) {
        return {
            unsynchronisation: !!(flagsByte & 128),
            extendedHeader: !!(flagsByte & 64),
            experimentalIndicator: !!(flagsByte & 32),
            footerPresent: !!(flagsByte & 16)
        }
    }
    return {}
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
