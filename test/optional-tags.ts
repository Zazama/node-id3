import * as NodeID3 from '../index'
import { assert } from 'chai'

describe('NodeID3 optional tags', function () {
    // Some tags is enough.
    const tags = {
        comment: undefined,
        chapter: undefined,
        synchronisedLyrics: undefined
    } satisfies NodeID3.Tags
    ([
        [ 'create', () => NodeID3.create(tags) ],
        [ 'write', () => NodeID3.write(tags, Buffer.alloc(0)) ],
        [ 'update', () => NodeID3.update(tags, Buffer.alloc(0)) ]
    ] as const).forEach(([name, buildBuffer ]) =>
        it(`${name}() filters out optionals tags`, function () {
            const buffer = buildBuffer()
            const readTags = NodeID3.read(buffer, { noRaw: true})
            assert.deepStrictEqual({}, readTags)
        })
    )
})
