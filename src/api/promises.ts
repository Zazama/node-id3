import { Tags, TagIdentifiers, WriteTags } from '../types/Tags'
import { Options } from '../types/Options'
import { create } from "./create"
import { read, ReadCallback } from "./read"
import { removeTags } from "./remove"
import { update } from "./update"
import { write, WriteCallback, WriteFileCallback } from "./write"

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

// TODO use util.promisify instead
/**
 * Asynchronous API for files and buffers operations using promises.
 *
 * @public
 */
export const Promises = {
    create: (tags: WriteTags) =>
        makePromise((settle: Settle<Buffer>) =>
            create(tags, result => settle(null, result)),
    ),
    write: (tags: WriteTags, filebuffer: string | Buffer) =>
        makePromise<Buffer|null>((callback: WriteCallback | WriteFileCallback) =>
            write(tags, filebuffer, callback)
        ),
    update: (tags: WriteTags, filebuffer: string | Buffer, options?: Options) =>
        makePromise<Buffer>((callback: WriteCallback | WriteFileCallback) =>
            update(tags, filebuffer, options ?? {}, callback)
        ),
    read: (file: string | Buffer, options?: Options) =>
        makePromise<Tags | TagIdentifiers>((callback: ReadCallback) =>
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
 * Asynchronous API for files and buffers operations using promises.
 *
 * @public
 * @deprecated Consider using `Promises` instead as `Promise` creates conflict
 *             with the Javascript native promise.
 */
export { Promises as Promise }
