const fs = require('fs')
const { isFunction, isString } = require('./util')

const TAG_SIZE = 128
const TAG_IDENTIFIER = Buffer.from('TAG', 'ascii')

/**
 * Encodes an ID3v1.1 tag as exactly 128 bytes.
 * All text is written as Latin-1 and the ID3v1.1 comment separator and track
 * byte are always emitted. A supplied version property does not change layout.
 *
 * @param {Object} tag ID3v1 values to encode.
 * @param {Object} [options] ID3v1 write options.
 * @returns {Buffer} Encoded 128-byte ID3v1.1 tag.
 */
function createTag(tag, options) {
    if(!tag || typeof tag !== 'object' || Array.isArray(tag)) {
        throw new TypeError('tag must be an object')
    }
    const truncation = getTruncation(options)
    const trackNumber = validateByte(tag.trackNumber, 'trackNumber')
    const genreId = tag.genreId === undefined || tag.genreId === null
        ? 255
        : validateByte(tag.genreId, 'genreId')
    const result = Buffer.alloc(TAG_SIZE)
    TAG_IDENTIFIER.copy(result)
    encodeText(tag.title, 30, truncation, 'title').copy(result, 3)
    encodeText(tag.artist, 30, truncation, 'artist').copy(result, 33)
    encodeText(tag.album, 30, truncation, 'album').copy(result, 63)
    encodeText(tag.year, 4, truncation, 'year').copy(result, 93)
    encodeText(tag.comment, 28, truncation, 'comment').copy(result, 97)
    result[125] = 0
    result[126] = trackNumber
    result[127] = genreId
    return result
}

/**
 * Reads a trailing ID3v1.0 or ID3v1.1 tag.
 * A zero separator at byte 125 identifies ID3v1.1, including when the track
 * byte is zero. Missing fields are omitted from the returned object.
 *
 * @param {Buffer} buffer Complete audio file data.
 * @returns {Object|null} Decoded ID3v1 tag, or null when none exists.
 */
function readTag(buffer) {
    const position = findTag(buffer)
    if(position === -1) return null

    const tag = buffer.slice(position)
    const isVersion11 = tag[125] === 0
    const result = {
        version: isVersion11 ? '1.1' : '1.0'
    }
    const fields = [
        ['title', 3, 30],
        ['artist', 33, 30],
        ['album', 63, 30],
        ['year', 93, 4],
        ['comment', 97, isVersion11 ? 28 : 30]
    ]
    fields.forEach(([name, start, length]) => {
        const value = readText(tag, start, length)
        if(value) result[name] = value
    })
    if(isVersion11 && tag[126] !== 0) result.trackNumber = tag[126]
    if(tag[127] !== 255) result.genreId = tag[127]
    return result
}

/**
 * Finds a valid ID3v1 tag at the only location where it may occur: the final
 * 128 bytes of a buffer. Internal `TAG` byte sequences are intentionally ignored.
 *
 * @param {Buffer} buffer Complete audio file data.
 * @returns {number} Start offset of the tag, or -1 when no trailing tag exists.
 */
function findTag(buffer) {
    if(!Buffer.isBuffer(buffer)) {
        throw new TypeError('fileOrBuffer must be a filepath or Buffer')
    }
    if(buffer.length < TAG_SIZE) return -1
    const position = buffer.length - TAG_SIZE
    return buffer.slice(position, position + 3).equals(TAG_IDENTIFIER) ? position : -1
}

/**
 * Separates a trailing ID3v1 tag from the preceding ID3v2/audio data.
 * The exact tag bytes are retained so write and update operations can preserve
 * them without decoding and re-encoding the tag.
 *
 * @param {Buffer} buffer Complete audio file data.
 * @returns {{buffer: Buffer, tag: Buffer|null}} Data without ID3v1 and the detached tag.
 */
function detachTag(buffer) {
    const position = findTag(buffer)
    if(position === -1) return { buffer, tag: null }
    return {
        buffer: buffer.slice(0, position),
        tag: buffer.slice(position)
    }
}

/**
 * Removes only a valid trailing ID3v1 tag.
 *
 * @param {Buffer} buffer Complete audio file data.
 * @returns {Buffer} Data without the trailing ID3v1 tag.
 */
function removeTag(buffer) {
    return detachTag(buffer).buffer
}

function readText(buffer, start, length) {
    return buffer.slice(start, start + length).toString('latin1').replace(/[\0 ]+$/, '')
}


/**
 * Validates ID3v1 text conversion options and returns the effective policy.
 *
 * @param {Object} [options] ID3v1 write options.
 * @returns {'truncate'|'error'} Effective truncation policy.
 */
function getTruncation(options) {
    if(options === undefined) return 'truncate'
    if(!options || typeof options !== 'object' || Array.isArray(options)) {
        throw new TypeError('options must be an object')
    }
    const truncation = options.id3v1Truncation === undefined
        ? (options.truncation === undefined ? 'truncate' : options.truncation)
        : options.id3v1Truncation
    if(truncation !== 'truncate' && truncation !== 'error') {
        throw new TypeError('id3v1Truncation must be "truncate" or "error"')
    }
    return truncation
}

function encodeText(value, width, truncation, name) {
    if(value === undefined || value === null) return Buffer.alloc(width)
    if(typeof value !== 'string' && !(value instanceof String)) {
        throw new TypeError(`${name} must be a string`)
    }

    let encodedValue = ''
    for(const character of String(value)) {
        const codePoint = character.codePointAt(0)
        if(codePoint === 0) {
            if(truncation === 'error') throw new TypeError(`${name} must not contain null characters`)
            continue
        }
        if(codePoint > 255) {
            if(truncation === 'error') throw new TypeError(`${name} contains characters outside Latin-1`)
            encodedValue += '?'
        } else {
            encodedValue += character
        }
    }

    let encoded = Buffer.from(encodedValue, 'latin1')
    if(encoded.length > width) {
        if(truncation === 'error') throw new RangeError(`${name} exceeds ${width} bytes`)
        encoded = encoded.slice(0, width)
    }
    const result = Buffer.alloc(width)
    encoded.copy(result)
    return result
}

function validateByte(value, name) {
    if(value === undefined || value === null) return 0
    if(typeof value !== 'number' || !Number.isInteger(value)) {
        throw new TypeError(`${name} must be an integer`)
    }
    if(value < 0 || value > 255) throw new RangeError(`${name} must be between 0 and 255`)
    return value
}


/**
 * Reads an ID3v1 tag from a filepath or Buffer.
 *
 * @param {string|Buffer} filebuffer Filepath or complete audio file data.
 * @param {Function} [fn] Optional error-first `(error, tag)` callback.
 * @returns {Object|null|undefined} Tag for synchronous calls, otherwise undefined.
 */
function readId3v1(filebuffer, fn) {
    if(isFunction(fn)) {
        if(isString(filebuffer)) {
            fs.readFile(filebuffer, (error, data) => {
                if(error) return fn(error, null)
                try {
                    fn(null, readTag(data))
                } catch(error) {
                    fn(error, null)
                }
            })
        } else {
            try {
                fn(null, readTag(filebuffer))
            } catch(error) {
                fn(error, null)
            }
        }
        return undefined
    }
    if(isString(filebuffer)) filebuffer = fs.readFileSync(filebuffer)
    return readTag(filebuffer)
}

function writeSync(tag, filebuffer, options) {
    if(isString(filebuffer)) {
        try {
            const data = fs.readFileSync(filebuffer)
            const newData = Buffer.concat([removeTag(data), createTag(tag, options)])
            fs.writeFileSync(filebuffer, newData, 'binary')
            return true
        } catch(error) {
            return error
        }
    }
    return Buffer.concat([removeTag(filebuffer), createTag(tag, options)])
}

/**
 * Creates or replaces a trailing ID3v1.1 tag on a filepath or Buffer.
 * File data is validated and encoded before a filepath is overwritten.
 *
 * @param {Object} tag ID3v1 values to encode.
 * @param {string|Buffer} filebuffer Filepath or complete audio file data.
 * @param {Object|Function} [options] ID3v1 write options or callback.
 * @param {Function} [fn] Optional error-first callback.
 * @returns {true|Buffer|Error|undefined} Result matching the selected API form.
 */
function writeId3v1(tag, filebuffer, options, fn) {
    if(isFunction(options)) {
        fn = options
        options = {}
    }
    if(isFunction(fn)) {
        if(isString(filebuffer)) {
            fs.readFile(filebuffer, (error, data) => {
                if(error) return fn(error)
                let newData
                try {
                    newData = Buffer.concat([removeTag(data), createTag(tag, options)])
                } catch(error) {
                    return fn(error)
                }
                fs.writeFile(filebuffer, newData, 'binary', fn)
            })
        } else {
            try {
                fn(null, Buffer.concat([removeTag(filebuffer), createTag(tag, options)]))
            } catch(error) {
                fn(error)
            }
        }
        return undefined
    }
    return writeSync(tag, filebuffer, options)
}

function removeSync(filebuffer) {
    if(isString(filebuffer)) {
        try {
            const data = fs.readFileSync(filebuffer)
            const newData = removeTag(data)
            fs.writeFileSync(filebuffer, newData, 'binary')
            return true
        } catch(error) {
            return error
        }
    }
    return removeTag(filebuffer)
}

/**
 * Removes only a trailing ID3v1 tag from a filepath or Buffer.
 * An absent tag is treated as a successful no-op.
 *
 * @param {string|Buffer} filebuffer Filepath or complete audio file data.
 * @param {Function} [fn] Optional error-first callback.
 * @returns {true|Buffer|Error|undefined} Result matching the selected API form.
 */
function removeId3v1(filebuffer, fn) {
    if(isFunction(fn)) {
        if(isString(filebuffer)) {
            fs.readFile(filebuffer, (error, data) => {
                if(error) return fn(error)
                let newData
                try {
                    newData = removeTag(data)
                } catch(error) {
                    return fn(error)
                }
                fs.writeFile(filebuffer, newData, 'binary', fn)
            })
        } else {
            try {
                fn(null, removeTag(filebuffer))
            } catch(error) {
                fn(error)
            }
        }
        return undefined
    }
    return removeSync(filebuffer)
}

module.exports = {
    readId3v1,
    removeId3v1,
    writeId3v1
}
