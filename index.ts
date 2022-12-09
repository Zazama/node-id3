/**
 * An ID3-Tag library written in Typescript.
 *
 * @remarks
 *
 * Used specification: {@link http://id3.org/id3v2.3.0 | id3.org v2.3.0}.
 *
 * @packageDocumentation
 */

// Types

export {
    Tags,
    TagAliases,
    TagIdentifiers,
    WriteTags
} from "./src/types/Tags"
export {
    Options
} from "./src/types/Options"

// Definitions

export {
    TagConstants
} from './src/definitions/TagConstants'

// Operations

export {
    create,
    CreateCallback
} from "./src/api/create"
export {
    read,
    ReadCallback
} from "./src/api/read"
export {
    removeTags,
    removeTagsFromBuffer,
    RemoveCallback
} from "./src/api/remove"
export {
    update
} from "./src/api/update"
export {
    write,
    WriteCallback
} from "./src/api/write"

// Promises

export {
    Promises,
    Promise
} from "./src/api/promises"
