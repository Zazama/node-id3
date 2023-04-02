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
