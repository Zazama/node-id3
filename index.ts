// Used specification: http://id3.org/id3v2.3.0

import { WriteTags } from './src/types/Tags'
import { Options } from './src/types/Options'
import { create } from "./src/api/create"
import { read, ReadCallback } from "./src/api/read"
import { removeTags } from "./src/api/remove"
import { update } from "./src/api/update"
import { write, WriteCallback } from "./src/api/write"

export { Tags, RawTags, WriteTags } from "./src/types/Tags"
export { Options } from "./src/types/Options"
export { TagConstants } from './src/definitions/TagConstants'

// Operations

export { create, CreateCallback } from "./src/api/create"
export { read, ReadCallback } from "./src/api/read"
export {
    removeTags,
    removeTagsFromBuffer,
    RemoveCallback
} from "./src/api/remove"
export { update } from "./src/api/update"
export { write, WriteCallback } from "./src/api/write"

type Settle<T> = {
    (error: NodeJS.ErrnoException | Error, result: null): void
    (error: null, result: T): void
}

function makePromise<T>(callback: (settle: Settle<T>) => void) {
    return new Promise<T>((resolve, reject) => {
        callback((error, result) => {
            if(error) {
                reject(error)
            } else {
                // result can't be null here according the Settle callable
                // type but TS can't evaluate it properly here, so use the
                // null assertion, and then disable the lint error.
                // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
                resolve(result!)
            }
        })
    })
}

export const Promises = {
    create: (tags: WriteTags) =>
        makePromise((settle: Settle<Buffer>) =>
            create(tags, result => settle(null, result)),
    ),
    write: (tags: WriteTags, filebuffer: string | Buffer) =>
        makePromise<Buffer>((callback: WriteCallback) =>
            write(tags, filebuffer, callback)
        ),
    update: (tags: WriteTags, filebuffer: string | Buffer, options?: Options) =>
        makePromise<Buffer>((callback: WriteCallback) =>
            update(tags, filebuffer, options ?? {}, callback)
        ),
    read: (file: string, options?: Options) =>
        makePromise((callback: ReadCallback) =>
            read(file, options ?? {}, callback)
        ),
    removeTags: (filepath: string) =>
        makePromise((settle: Settle<void>) =>
            removeTags(
                filepath,
                (error) => error ? settle(error, null) : settle(null)
            )
        )
} as const

/**
 * @deprecated consider using `Promises` instead, `Promise` creates conflict
 *             with the Javascript native promise.
 */
export { Promises as Promise }
