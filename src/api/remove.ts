import * as fs from "fs"
import { isFunction } from "../util"
import { removeId3Tag } from "../id3-tag"

/**
 * Remove already written ID3-Frames from a buffer
 *
 * @public
 */
export function removeTagsFromBuffer(data: Buffer) {
    return removeId3Tag(data)
}

/**
 * Callback signatures for asynchronous remove operation.
 *
 * @param error - `null` indicates success.
 *
 * @public
 */
export type RemoveCallback =
    (error: NodeJS.ErrnoException | Error | null) => void

/**
 * Removes synchronously any written ID3-Frames from the specified file.
 *
 * @public
 */
export function removeTags(filepath: string): true | Error

/**
 * Removes asynchronously any written ID3-Frames from the specified file.
 *
 * @public
 */
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

        fs.writeFile(filepath, newData, 'binary', (error) => {
            if(error) {
                callback(error)
            } else {
                callback(null)
            }
        })
    })
}
