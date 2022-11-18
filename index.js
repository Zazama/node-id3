const fs = require('fs')
const ID3Definitions = require("./src/ID3Definitions")
const ID3Frames = require('./src/ID3Frames')
const ID3Util = require('./src/ID3Util')
const zlib = require('zlib')

/*
**  Used specification: http://id3.org/id3v2.3.0
*/

/**
 * @param {any} value
 * @returns {boolean} true if value is a function
 */
const isFunction = (value) => value && typeof value === 'function'

/**
 * @param {any} value
 * @returns  {boolean} true if value is a string
 */
const isString = (value) => typeof value === 'string' || value instanceof String

/**
 * Write passed tags to a file/buffer
 * @param tags - Object containing tags to be written
 * @param filebuffer - Can contain a filepath string or buffer
 * @param fn - (optional) Function for async version
 * @returns {boolean|Buffer|Error}
 */
module.exports.write = function(tags, filebuffer, fn) {
    let completeTag = this.create(tags)
    if(filebuffer instanceof Buffer) {
        filebuffer = this.removeTagsFromBuffer(filebuffer) || filebuffer
        let completeBuffer = Buffer.concat([completeTag, filebuffer])
        if(isFunction(fn)) {
            fn(null, completeBuffer)
            return undefined
        } else {
            return completeBuffer
        }
    }

    if(isFunction(fn)) {
        try {
            fs.readFile(filebuffer, function(err, data) {
                if(err) {
                    fn(err)
                    return
                }
                data = this.removeTagsFromBuffer(data) || data
                let rewriteFile = Buffer.concat([completeTag, data])
                fs.writeFile(filebuffer, rewriteFile, 'binary', (err) => {
                    fn(err)
                })
            }.bind(this))
        } catch(err) {
            fn(err)
        }
    } else {
        try {
            let data = fs.readFileSync(filebuffer)
            data = this.removeTagsFromBuffer(data) || data
            let rewriteFile = Buffer.concat([completeTag, data])
            fs.writeFileSync(filebuffer, rewriteFile, 'binary')
            return true
        } catch(err) {
            return err
        }
    }
}

/**
 * Creates a buffer containing the ID3 Tag
 * @param tags - Object containing tags to be written
 * @param fn fn - (optional) Function for async version
 * @returns {Buffer}
 */
module.exports.create = function(tags, fn) {
    let frames = []

    //  Create & push a header for the ID3-Frame
    const header = Buffer.alloc(10)
    header.fill(0)
    header.write("ID3", 0)              //File identifier
    header.writeUInt16BE(0x0300, 3)     //Version 2.3.0  --  03 00
    header.writeUInt16BE(0x0000, 5)     //Flags 00

    //Last 4 bytes are used for header size, but have to be inserted later, because at this point, its size is not clear.
    frames.push(header)

    frames = frames.concat(this.createBuffersFromTags(tags))

    //  Calculate frame size of ID3 body to insert into header

    let totalSize = 0
    frames.forEach((frame) => {
        totalSize += frame.length
    })

    //  Don't count ID3 header itself
    totalSize -= 10
    //  ID3 header size uses only 7 bits of a byte, bit shift is needed
    let size = ID3Util.encodeSize(totalSize)

    //  Write bytes to ID3 frame header, which is the first frame
    frames[0].writeUInt8(size[0], 6)
    frames[0].writeUInt8(size[1], 7)
    frames[0].writeUInt8(size[2], 8)
    frames[0].writeUInt8(size[3], 9)

    if(isFunction(fn)) {
        fn(Buffer.concat(frames))
    } else {
        return Buffer.concat(frames)
    }
}

/**
 * Returns array of buffers created by tags specified in the tags argument
 * @param tags - Object containing tags to be written
 * @returns {Array}
 */
module.exports.createBuffersFromTags = function(tags) {
    let frames = []
    if(!tags) {
        return frames
    }
    const rawObject = Object.keys(tags).reduce((acc, val) => {
        if(ID3Definitions.FRAME_IDENTIFIERS.v3[val] !== undefined) {
            acc[ID3Definitions.FRAME_IDENTIFIERS.v3[val]] = tags[val]
        } else if(ID3Definitions.FRAME_IDENTIFIERS.v4[val] !== undefined) {
            /**
             * Currently, node-id3 always writes ID3 version 3.
             * However, version 3 and 4 are very similar, and node-id3 can also read version 4 frames.
             * Until version 4 is fully supported, as a workaround, allow writing version 4 frames into a version 3 tag.
             * If a reader does not support a v4 frame, it's (per spec) supposed to skip it, so it should not be a problem.
             */
            acc[ID3Definitions.FRAME_IDENTIFIERS.v4[val]] = tags[val]
        } else {
            acc[val] = tags[val]
        }
        return acc
    }, {})

    Object.keys(rawObject).forEach((specName) => {
        let frame
        // Check if invalid specName
        if(specName.length !== 4) {
            return
        }
        if(ID3Frames[specName] !== undefined) {
            frame = ID3Frames[specName].create(rawObject[specName], 3, this)
        } else if(specName.startsWith('T')) {
            frame = ID3Frames.GENERIC_TEXT.create(specName, rawObject[specName], 3)
        } else if(specName.startsWith('W')) {
            if(ID3Util.getSpecOptions(specName, 3).multiple && rawObject[specName] instanceof Array && rawObject[specName].length > 0) {
                frame = Buffer.alloc(0)
                // deduplicate array
                for(let url of [...new Set(rawObject[specName])]) {
                    frame = Buffer.concat([frame, ID3Frames.GENERIC_URL.create(specName, url, 3)])
                }
            } else {
                frame = ID3Frames.GENERIC_URL.create(specName, rawObject[specName], 3)
            }
        }

        if (frame && frame instanceof Buffer) {
            frames.push(frame)
        }
    })

    return frames
}

function readSync(filebuffer, options) {
    if(isString(filebuffer)) {
        filebuffer = fs.readFileSync(filebuffer)
    }
    return this.getTagsFromBuffer(filebuffer, options)
}

function readAsync(filebuffer, options, fn) {
    if(isString(filebuffer)) {
        fs.readFile(filebuffer, (error, data) => {
            if(error) {
                fn(error, null)
            } else {
                fn(null, this.getTagsFromBuffer(data, options))
            }
        })
    } else {
        fn(null, this.getTagsFromBuffer(filebuffer, options))
    }
}

/**
 * Read ID3-Tags from passed buffer/filepath
 * @param filebuffer - Can contain a filepath string or buffer
 * @param options - (optional) Object containing options
 * @param fn - (optional) Function for async version
 * @returns {boolean}
 */
module.exports.read = function(filebuffer, options, fn) {
    if(!options || typeof options === 'function') {
        fn = fn || options
        options = {}
    }
    if(isFunction(fn)) {
        return readAsync.bind(this)(filebuffer, options, fn)
    }
    return readSync.bind(this)(filebuffer, options)
}

/**
 * Update ID3-Tags from passed buffer/filepath
 * @param tags - Object containing tags to be written
 * @param filebuffer - Can contain a filepath string or buffer
 * @param options - (optional) Object containing options
 * @param fn - (optional) Function for async version
 * @returns {boolean|Buffer|Error}
 */
module.exports.update = function(tags, filebuffer, options, fn) {
    if(!options || typeof options === 'function') {
        fn = fn || options
        options = {}
    }

    const rawTags = Object.keys(tags).reduce((acc, val) => {
        if(ID3Definitions.FRAME_IDENTIFIERS.v3[val] !== undefined) {
            acc[ID3Definitions.FRAME_IDENTIFIERS.v3[val]] = tags[val]
        } else {
            acc[val] = tags[val]
        }
        return acc
    }, {})

    const updateFn = (currentTags) => {
        currentTags = currentTags.raw || {}
        Object.keys(rawTags).map((specName) => {
            const options = ID3Util.getSpecOptions(specName, 3)
            const cCompare = {}
            if(options.multiple && currentTags[specName] && rawTags[specName]) {
                if(options.updateCompareKey) {
                    currentTags[specName].forEach((cTag, index) => {
                        cCompare[cTag[options.updateCompareKey]] = index
                    })

                }
                if (!(rawTags[specName] instanceof Array)) {
                    rawTags[specName] = [rawTags[specName]]
                }
                rawTags[specName].forEach((rTag) => {
                    const comparison = cCompare[rTag[options.updateCompareKey]]
                    if (comparison !== undefined) {
                        currentTags[specName][comparison] = rTag
                    } else {
                        currentTags[specName].push(rTag)
                    }
                })
            } else {
                currentTags[specName] = rawTags[specName]
            }
        })

        return currentTags
    }

    if(!isFunction(fn)) {
        return this.write(updateFn(this.read(filebuffer, options)), filebuffer)
    }

    this.write(updateFn(this.read(filebuffer, options)), filebuffer, fn)
}

module.exports.getTagsFromBuffer = function(filebuffer, options) {
    let framePosition = ID3Util.getFramePosition(filebuffer)
    if(framePosition === -1) {
        return this.getTagsFromFrames([], 3, options)
    }
    const frameSize = ID3Util.decodeSize(filebuffer.slice(framePosition + 6, framePosition + 10)) + 10
    let ID3Frame = Buffer.alloc(frameSize + 1)
    filebuffer.copy(ID3Frame, 0, framePosition)
    //ID3 version e.g. 3 if ID3v2.3.0
    let ID3Version = ID3Frame[3]
    const tagFlags = ID3Util.parseTagHeaderFlags(ID3Frame)
    let extendedHeaderOffset = 0
    if(tagFlags.extendedHeader) {
        if(ID3Version === 3) {
            extendedHeaderOffset = 4 + filebuffer.readUInt32BE(10)
        } else if(ID3Version === 4) {
            extendedHeaderOffset = ID3Util.decodeSize(filebuffer.slice(10, 14))
        }
    }
    let ID3FrameBody = Buffer.alloc(frameSize - 10 - extendedHeaderOffset)
    filebuffer.copy(ID3FrameBody, 0, framePosition + 10 + extendedHeaderOffset)

    let frames = this.getFramesFromID3Body(ID3FrameBody, ID3Version, options)

    return this.getTagsFromFrames(frames, ID3Version, options)
}

module.exports.getFramesFromID3Body = function(ID3FrameBody, ID3Version, options = {}) {
    let currentPosition = 0
    let frames = []
    if(!ID3FrameBody || !(ID3FrameBody instanceof Buffer)) {
        return frames
    }

    let identifierSize = 4
    let textframeHeaderSize = 10
    if(ID3Version === 2) {
        identifierSize = 3
        textframeHeaderSize = 6
    }

    while(currentPosition < ID3FrameBody.length && ID3FrameBody[currentPosition] !== 0x00) {
        let bodyFrameHeader = Buffer.alloc(textframeHeaderSize)
        ID3FrameBody.copy(bodyFrameHeader, 0, currentPosition)

        let decodeSize = false
        if(ID3Version === 4) {
            decodeSize = true
        }
        let bodyFrameSize = ID3Util.getFrameSize(bodyFrameHeader, decodeSize, ID3Version)
        if(bodyFrameSize + 10 > (ID3FrameBody.length - currentPosition)) {
            break
        }
        const specName = bodyFrameHeader.toString('utf8', 0, identifierSize)
        if(options.exclude instanceof Array && options.exclude.includes(specName) || options.include instanceof Array && !options.include.includes(specName)) {
            currentPosition += bodyFrameSize + textframeHeaderSize
            continue
        }
        const frameHeaderFlags = ID3Util.parseFrameHeaderFlags(bodyFrameHeader, ID3Version)
        let bodyFrameBuffer = Buffer.alloc(bodyFrameSize)
        ID3FrameBody.copy(bodyFrameBuffer, 0, currentPosition + textframeHeaderSize + (frameHeaderFlags.dataLengthIndicator ? 4 : 0))
        //  Size of sub frame + its header
        currentPosition += bodyFrameSize + textframeHeaderSize
        frames.push({
            name: specName,
            flags: frameHeaderFlags,
            body: frameHeaderFlags.unsynchronisation ? ID3Util.processUnsynchronisedBuffer(bodyFrameBuffer) : bodyFrameBuffer
        })
    }

    return frames
}

module.exports.getTagsFromFrames = function(frames, ID3Version, options = {}) {
    let tags = { }
    let raw = { }

    frames.forEach((frame) => {
        let specName
        let identifier
        if(ID3Version === 2) {
            specName = ID3Definitions.FRAME_IDENTIFIERS.v3[ID3Definitions.FRAME_INTERNAL_IDENTIFIERS.v2[frame.name]]
            identifier = ID3Definitions.FRAME_INTERNAL_IDENTIFIERS.v2[frame.name]
        } else if(ID3Version === 3 || ID3Version === 4) {
            /**
             * Due to their similarity, it's possible to mix v3 and v4 frames even if they don't exist in their corrosponding spec.
             * Programs like Mp3tag allow you to do so, so we should allow reading e.g. v4 frames from a v3 ID3 Tag
             */
            specName = frame.name
            identifier = ID3Definitions.FRAME_INTERNAL_IDENTIFIERS.v3[frame.name] || ID3Definitions.FRAME_INTERNAL_IDENTIFIERS.v4[frame.name]
        }

        if(!specName || !identifier || frame.flags.encryption) {
            return
        }

        if(frame.flags.compression) {
            if(frame.body.length < 5) {
                return
            }
            const inflatedSize = frame.body.readInt32BE()
            /*
            * ID3 spec defines that compression is stored in ZLIB format, but doesn't specify if header is present or not.
            * ZLIB has a 2-byte header.
            * 1. try if header + body decompression
            * 2. else try if header is not stored (assume that all content is deflated "body")
            * 3. else try if inflation works if the header is omitted (implementation dependent)
            * */
            try {
                frame.body = zlib.inflateSync(frame.body.slice(4))
            } catch (e) {
                try {
                    frame.body = zlib.inflateRawSync(frame.body.slice(4))
                } catch (e) {
                    try {
                        frame.body = zlib.inflateRawSync(frame.body.slice(6))
                    } catch (e) {
                        return
                    }
                }
            }
            if(frame.body.length !== inflatedSize) {
                return
            }
        }

        let decoded
        if(ID3Frames[specName]) {
            decoded = ID3Frames[specName].read(frame.body, ID3Version, this)
        } else if(specName.startsWith('T')) {
            decoded = ID3Frames.GENERIC_TEXT.read(frame.body, ID3Version)
        } else if(specName.startsWith('W')) {
            decoded = ID3Frames.GENERIC_URL.read(frame.body, ID3Version)
        }

        if(decoded) {
            if(ID3Util.getSpecOptions(specName, ID3Version).multiple) {
                if(!options.onlyRaw) {
                    if(!tags[identifier]) {
                        tags[identifier] = []
                    }
                    tags[identifier].push(decoded)
                }
                if(!options.noRaw) {
                    if(!raw[specName]) {
                        raw[specName] = []
                    }
                    raw[specName].push(decoded)
                }
            } else {
                if(!options.onlyRaw) {
                    tags[identifier] = decoded
                }
                if(!options.noRaw) {
                    raw[specName] = decoded
                }
            }
        }
    })

    if(options.onlyRaw) {
        return raw
    }
    if(options.noRaw) {
        return tags
    }

    tags.raw = raw
    return tags
}

/**
 * Checks and removes already written ID3-Frames from a buffer
 * @param data - Buffer
 * @returns {boolean|Buffer}
 */
module.exports.removeTagsFromBuffer = removeTagsFromBuffer
function removeTagsFromBuffer(data) {
        let framePosition = ID3Util.getFramePosition(data)

    if (framePosition === -1) {
        return data
    }

    let hSize = Buffer.from([data[framePosition + 6], data[framePosition + 7], data[framePosition + 8], data[framePosition + 9]])

    const isMsbSet = !!((hSize[0] | hSize[1] | hSize[2] | hSize[3]) & 0x80)
    if (isMsbSet) {
        //  Invalid tag size (msb not 0)
        return false
    }

    if (data.length >= framePosition + 10) {
        const size = ID3Util.decodeSize(data.slice(framePosition + 6, framePosition + 10))
        return Buffer.concat([data.slice(0, framePosition), data.slice(framePosition + size + 10)])
    }

    return data
}

/**
 * @param {string} filepath - Filepath to file
 * @returns {boolean|Error}
 */
function removeTagsSync(filepath) {
    let data
    try {
        data = fs.readFileSync(filepath)
    } catch(error) {
        return error
    }

    const newData = removeTagsFromBuffer(data)
    if(!newData) {
        return false
    }

    try {
        fs.writeFileSync(filepath, newData, 'binary')
    } catch(error) {
        return error
    }

    return true
}

/**
 * @param {string} filepath - Filepath to file
 * @param {(error: Error) => void} fn - Function for async usage
 * @returns {void}
 */
function removeTagsAsync(filepath, fn) {
    fs.readFile(filepath, (error, data) => {
        if(error) {
            fn(error)
        }

        const newData = removeTagsFromBuffer(data)
        if(!newData) {
            fn(error)
            return
        }

        fs.writeFile(filepath, newData, 'binary', (error) => {
            if(error) {
                fn(error)
            } else {
                fn(false)
            }
        })
    })
}

/**
 * Checks and removes already written ID3-Frames from a file
 * @param {string} filepath - Filepath to file
 * @param fn - (optional) Function for async usage
 * @returns {boolean|Error}
 */
module.exports.removeTags = function(filepath, fn) {
    if(isFunction(fn)) {
        return removeTagsAsync(filepath, fn)
    }
    return removeTagsSync(filepath)
}

module.exports.Promise = {
    write: (tags, file) => {
        return new Promise((resolve, reject) => {
            this.write(tags, file, (err, ret) => {
                if(err) {
                    reject(err)
                } else {
                    resolve(ret)
                }
            })
        })
    },
    update: (tags, file) => {
        return new Promise((resolve, reject) => {
            this.update(tags, file, (err, ret) => {
                if(err) {
                    reject(err)
                } else {
                    resolve(ret)
                }
            })
        })
    },
    create: (tags) => {
        return new Promise((resolve) => {
            this.create(tags, (buffer) => {
                resolve(buffer)
            })
        })
    },
    read: (file, options) => {
        return new Promise((resolve, reject) => {
            this.read(file, options, (err, ret) => {
                if(err) {
                    reject(err)
                } else {
                    resolve(ret)
                }
            })
        })
    },
    removeTags: (filepath) => {
        return new Promise((resolve, reject) => {
            this.removeTags(filepath, (err) => {
                if(err) {
                    reject(err)
                } else {
                    resolve()
                }
            })
        })
    }
}

module.exports.Constants = ID3Definitions.Constants
