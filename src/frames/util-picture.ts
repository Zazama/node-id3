import * as fs from "fs"
import { isBuffer } from "../util"

function getPictureMimeTypeFromBuffer(pictureBuffer: Buffer) {
    if (
        pictureBuffer.length > 3 &&
        pictureBuffer.compare(Buffer.from([0xff, 0xd8, 0xff]), 0, 3, 0, 3) === 0
    ) {
        return "image/jpeg"
    }
    if (
        pictureBuffer.length > 8 &&
        pictureBuffer.compare(Buffer.from([0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A]), 0, 8, 0, 8) === 0
    ) {
        return "image/png"
    }
    return ""
}

export function retrievePictureAndMimeType({
    filenameOrBuffer,
    mimeType
}: {
    filenameOrBuffer?: Buffer | string
    mimeType?: string
}) {
    if (!filenameOrBuffer) {
        throw new TypeError("Missing image buffer or filename")
    }
    const pictureBuffer = isBuffer(filenameOrBuffer) ?
        filenameOrBuffer : fs.readFileSync(filenameOrBuffer)
    return {
        pictureBuffer,
        mimeType: mimeType ?? getPictureMimeTypeFromBuffer(pictureBuffer)
    }
}
