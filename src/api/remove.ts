import * as fs from "fs"
import * as ID3Util from "../ID3Util"
import { isFunction } from "../util"

/**
 * Remove already written ID3-Frames from a buffer
 */
export function removeTagsFromBuffer(data: Buffer) {
    const tagPosition = ID3Util.getTagPosition(data)

    if (tagPosition === -1) {
        return data
    }

    const tagHeaderSize = 10
    const encodedSize = data.subarray(
        tagPosition + 6,
        tagPosition + tagHeaderSize
    )
    if (!ID3Util.isValidEncodedSize(encodedSize)) {
        return false
    }

    if (data.length >= tagPosition + tagHeaderSize) {
        const size = ID3Util.decodeSize(encodedSize)
        return Buffer.concat([
            data.subarray(0, tagPosition),
            data.subarray(tagPosition + size + tagHeaderSize)
        ])
    }

    return data
}

export type RemoveCallback =
    (error: NodeJS.ErrnoException | Error | null) => void

/**
 * Remove already written ID3-Frames from a file
 */
export function removeTags(filepath: string): boolean | Error
export function removeTags(filepath: string, callback: RemoveCallback): void
export function removeTags(filepath: string, callback?: RemoveCallback) {
    if(isFunction(callback)) {
        return removeTagsAsync(filepath, callback)
    }
    return removeTagsSync(filepath)
}

function removeTagsSync(filepath: string) {
    let data
    try {
        data = fs.readFileSync(filepath)
    } catch(error) {
        return error as Error
    }

    const newData = removeTagsFromBuffer(data)
    if(!newData) {
        return false
    }

    try {
        fs.writeFileSync(filepath, newData, 'binary')
    } catch(error) {
        return error as Error
    }

    return true
}

function removeTagsAsync(filepath: string, callback: RemoveCallback) {
    fs.readFile(filepath, (error, data) => {
        if(error) {
            callback(error)
            return
        }

        const newData = removeTagsFromBuffer(data)
        if(!newData) {
            callback(error)
            return
        }

        fs.writeFile(filepath, newData, 'binary', (error) => {
            if(error) {
                callback(error)
            } else {
                callback(null)
            }
        })
    })
}
