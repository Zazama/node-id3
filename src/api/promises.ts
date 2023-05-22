import { Tags, TagIdentifiers, WriteTags } from '../types/Tags'
import { Options } from '../types/Options'
import { ReadCallback } from "../types/read"
import { read, } from "./read"
import { removeTags } from "./remove"
import { update } from "./update"
import { write } from "./write"

type Settle<T> = {
    (error: NodeJS.ErrnoException | Error, result: null): void
    (error: null, result: T): void
}

function makePromise<T>(callback: (settle: Settle<T>) => void) {
    return new Promise<T>((resolve, reject) => {
        callback((error, result) => {
            if (error) {
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

/**
 * Asynchronous API for files and buffers operations using promises.
 *
 * @public
 */
export const Promises = {
    write: (tags: WriteTags, filepath: string) =>
        makePromise<void>(settle => write(
            tags,
            filepath,
            (error) => error ? settle(error, null) : settle(null)
        )),
    update: (tags: WriteTags, filepath: string, options?: Options) =>
        makePromise<void>((settle) => update(
            tags,
            filepath,
            options ?? {},
            (error) => error ? settle(error, null) : settle(null)
        )
    ),
    read: (filepath: string, options?: Options) =>
        makePromise<Tags | TagIdentifiers>((callback: ReadCallback) =>
            read(filepath, options ?? {}, callback)
        ),
    removeTags: (filepath: string) =>
        makePromise<void>((settle) =>
            removeTags(
                filepath,
                (error) => error ? settle(error, null) : settle(null)
            )
        )
} as const
