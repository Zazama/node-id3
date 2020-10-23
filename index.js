const fs = require('fs')
const iconv = require("iconv-lite")
const ID3FrameBuilder = require("./src/ID3FrameBuilder")
const ID3FrameReader = require("./src/ID3FrameReader")

module.exports = new NodeID3

/*
**  Used specification: http://id3.org/id3v2.3.0
*/

/*
**  List of official text information frames
**  LibraryName: "T***"
**  Value is the ID of the text frame specified in the link above, the object's keys are just for simplicity, you can also use the ID directly.
*/
const TFrames = {
    album:              "TALB",
    bpm:                "TBPM",
    composer:           "TCOM",
    genre:              "TCON",
    copyright:          "TCOP",
    date:               "TDAT",
    playlistDelay:      "TDLY",
    encodedBy:          "TENC",
    textWriter:         "TEXT",
    fileType:           "TFLT",
    time:               "TIME",
    contentGroup:       "TIT1",
    title:              "TIT2",
    subtitle:           "TIT3",
    initialKey:         "TKEY",
    language:           "TLAN",
    length:             "TLEN",
    mediaType:          "TMED",
    originalTitle:      "TOAL",
    originalFilename:   "TOFN",
    originalTextwriter: "TOLY",
    originalArtist:     "TOPE",
    originalYear:       "TORY",
    fileOwner:          "TOWN",
    artist:             "TPE1",
    performerInfo:      "TPE2",
    conductor:          "TPE3",
    remixArtist:        "TPE4",
    partOfSet:          "TPOS",
    publisher:          "TPUB",
    trackNumber:        "TRCK",
    recordingDates:     "TRDA",
    internetRadioName:  "TRSN",
    internetRadioOwner: "TRSO",
    size:               "TSIZ",
    ISRC:               "TSRC",
    encodingTechnology: "TSSE",
    year:               "TYER"
}

const TFrameSpecs = Object.keys(TFrames).reduce((ret, key) => {
    ret[TFrames[key]] = key
    return ret
}, {})

const TFramesV220 =  {
    album:              "TAL",
    bpm:                "TBP",
    composer:           "TCM",
    genre:              "TCO",
    copyright:          "TCR",
    date:               "TDA",
    playlistDelay:      "TDY",
    encodedBy:          "TEN",
    textWriter:         "TEXT",
    fileType:           "TFT",
    time:               "TIM",
    contentGroup:       "TT1",
    title:              "TT2",
    subtitle:           "TT3",
    initialKey:         "TKE",
    language:           "TLA",
    length:             "TLE",
    mediaType:          "TMT",
    originalTitle:      "TOT",
    originalFilename:   "TOF",
    originalTextwriter: "TOL",
    originalArtist:     "TOA",
    originalYear:       "TOR",
    artist:             "TP1",
    performerInfo:      "TP2",
    conductor:          "TP3",
    remixArtist:        "TP4",
    partOfSet:          "TPA",
    publisher:          "TPB",
    trackNumber:        "TRK",
    recordingDates:     "TRD",
    size:               "TSI",
    ISRC:               "TRC",
    encodingTechnology: "TSS",
    year:               "TYE"
}

const TFrameV220Specs = Object.keys(TFramesV220).reduce((ret, key) => {
    ret[TFramesV220[key]] = key
    return ret
}, {})

/*
**  List of non-text frames which follow their specific specification
**  name    => Frame ID
**  create  => function to create the frame
**  read    => function to read the frame
*/
const SFrames = {
    comment: {
        create: "createCommentFrame",
        read: "readCommentFrame",
        name: "COMM"
    },
    image: {
        create: "createPictureFrame",
        read: "readPictureFrame",
        name: "APIC"
    },
    unsynchronisedLyrics: {
        create: "createUnsynchronisedLyricsFrame",
        read: "readUnsynchronisedLyricsFrame",
        name: "USLT"
    },
    userDefinedText: {
        create: "createUserDefinedText",
        read: "readUserDefinedText",
        name: "TXXX",
        multiple: true,
        updateCompareKey: "description"
    },
    popularimeter: {
        create: "createPopularimeterFrame",
        read: "readPopularimeterFrame",
        name: "POPM"
    },
    private: {
        create: "createPrivateFrame",
        read: "readPrivateFrame",
        name: "PRIV",
        multiple: true
    },
    chapter: {
        create: "createChapterFrame",
        read: "readChapterFrame",
        name: "CHAP",
        multiple: true
    },
    tableOfContents: {
        create: "createTableOfContentsFrame",
        read: "readTableOfContentsFrame",
        name: "CTOC",
        multiple: true
    },
    userDefinedUrl: {
        create: "createUserDefinedUrl",
        read: "readUserDefinedUrl",
        name: "WXXX",
        multiple: true,
        updateCompareKey: "description"
    }
}

const SFrameSpecs = Object.keys(SFrames).reduce((ret, key) => {
    ret[SFrames[key].name] = key
    return ret
}, {})

const SFramesV220 = {
    image: {
        create: "createPictureFrame",
        read: "readPictureFrame",
        name: "PIC"
    }
}

const SFrameV220Specs = Object.keys(SFramesV220).reduce((ret, key) => {
    ret[SFramesV220[key].name] = key
    return ret
}, {})

/*
**  List of URL frames.
**  name           => Frame ID
**  multiple       => Whether multiple of this frame can exist
**  hasDescription => Whether this frame may include a description
*/
const WFrames = {
    commercialUrl: {
        name: "WCOM",
        multiple: true
    },
    copyrightUrl: {
        name: "WCOP"
    },
    fileUrl: {
        name: "WOAF"
    },
    artistUrl: {
        name: "WOAR",
        multiple: true
    },
    audioSourceUrl: {
        name: "WOAS"
    },
    radioStationUrl: {
        name: "WORS"
    },
    paymentUrl: {
        name: "WPAY"
    },
    publisherUrl: {
        name: "WPUB"
    }
}

const WFrameSpecs = Object.keys(WFrames).reduce((ret, key) => {
    ret[WFrames[key].name] = key
    return ret
}, {})

/*
   4.3.1 WAF Official audio file webpage
   4.3.1 WAR Official artist/performer webpage
   4.3.1 WAS Official audio source webpage
   4.3.1 WCM Commercial information
   4.3.1 WCP Copyright/Legal information
   4.3.1 WPB Publishers official webpage
   4.3.2 WXX User defined URL link frame
*/
const WFramesV220 = {
    commercialUrl: {
        name: "WCM",
        multiple: true
    },
    copyrightUrl: {
        name: "WCP"
    },
    fileUrl: {
        name: "WAF"
    },
    artistUrl: {
        name: "WAR",
        multiple: true
    },
    audioSourceUrl: {
        name: "WAS"
    },
    publisherUrl: {
        name: "WPB"
    },
    userDefinedUrl: {
        name: "WXX",
        multiple: true,
        hasDescription: true
    }
}

const WFrameV220Specs = Object.keys(WFramesV220).reduce((ret, key) => {
    ret[WFramesV220[key].name] = key
    return ret
}, {})

/*
**  Officially available types of the picture frame
*/
const APICTypes = [
	"other",
	"file icon",
	"other file icon",
	"front cover",
	"back cover",
	"leaflet page",
	"media",
	"lead artist",
	"artist",
	"conductor",
	"band",
	"composer",
	"lyricist",
	"recording location",
	"during recording",
	"during performance",
	"video screen capture",
	"a bright coloured fish",
	"illustration",
	"band logotype",
	"publisher logotype"
]

const ENCODINGS = [
    'ISO-8859-1', 'UTF-16', 'UTF-16BE', 'utf8'
]

function NodeID3() {
}

/*
**  Write passed tags to a file/buffer @ filebuffer
**  tags        => Object
**  filebuffer  => String || Buffer
**  fn          => Function (for asynchronous usage)
*/
NodeID3.prototype.write = function(tags, filebuffer, fn) {
    let completeTag = this.create(tags)
    if(filebuffer instanceof Buffer) {
        filebuffer = this.removeTagsFromBuffer(filebuffer) || filebuffer
        let completeBuffer = Buffer.concat([completeTag, filebuffer])
        if(fn && typeof fn === 'function') {
            fn(null, completeBuffer)
            return
        } else {
            return completeBuffer
        }
    }

    if(fn && typeof fn === 'function') {
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

NodeID3.prototype.create = function(tags, fn) {
    let frames = []

    //  Push a header for the ID3-Frame
    frames.push(this.createTagHeader())

    frames = frames.concat(this.createBuffersFromTags(tags))

    //  Calculate frame size of ID3 body to insert into header

    let totalSize = 0
    frames.forEach((frame) => {
        totalSize += frame.length
    })

    //  Don't count ID3 header itself
    totalSize -= 10
    //  ID3 header size uses only 7 bits of a byte, bit shift is needed
    let size = this.encodeSize(totalSize)

    //  Write bytes to ID3 frame header, which is the first frame
    frames[0].writeUInt8(size[0], 6)
    frames[0].writeUInt8(size[1], 7)
    frames[0].writeUInt8(size[2], 8)
    frames[0].writeUInt8(size[3], 9)

    if(fn && typeof fn === 'function') {
        fn(Buffer.concat(frames))
    } else {
        return Buffer.concat(frames)
    }
}

/*
* Returns array of buffers created by tags specified in the tags argument
* */
NodeID3.prototype.createBuffersFromTags = function(tags) {
    let frames = []
    if(!tags) return frames
    let tagNames = Object.keys(tags)

    tagNames.forEach(function (tag, index) {
        //  Check if passed tag is text frame (Alias or ID)
        let frame
        if (TFrames[tag] || TFrameSpecs[tag]) {
            let specName = TFrames[tag] || tag
            frame = this.createTextFrame(specName, tags[tag])
        } else if (WFrames[tag] || WFrameSpecs[tag]) {
            let specName = WFrames[tag] ? WFrames[tag].name : tag
            let multiple = WFrames[WFrameSpecs[specName]].multiple
            if(multiple && tags[tag] instanceof Array && tags[tag].length > 0) {
                frame = Buffer.alloc(0)
                // deduplicate array
                for(let url of [...new Set(tags[tag])]) {
                    frame = Buffer.concat([frame, this.createUrlFrame(specName, url)])
                }
            } else {
                frame = this.createUrlFrame(specName, tags[tag])
            }
        } else if (SFrames[tag]) {  //  Check if Alias of special frame
            let createFrameFunction = SFrames[tag].create
            frame = this[createFrameFunction](tags[tag])
        } else if (SFrameSpecs[tag]) {  //  Check if ID of special frame
            //  get create function from special frames where tag ID is found at SFrame[index].name
            let createFrameFunction = SFrames[SFrameSpecs[tag]].create
            frame = this[createFrameFunction](tags[tag])
        }

        if (frame instanceof Buffer) {
            frames.push(frame)
        }
    }.bind(this))

    return frames
}

/*
**  Read ID3-Tags from passed buffer/filepath
**  filebuffer  => Buffer || String
**  options     => Object
**  fn          => function (for asynchronous usage)
*/
NodeID3.prototype.read = function(filebuffer, options, fn) {
    if(!options || typeof options === 'function') {
        fn = fn || options
        options = {}
    }
    if(!fn || typeof fn !== 'function') {
        if(typeof filebuffer === "string" || filebuffer instanceof String) {
            filebuffer = fs.readFileSync(filebuffer)
        }
        let tags = this.getTagsFromBuffer(filebuffer, options)
        return tags
    } else {
        if(typeof filebuffer === "string" || filebuffer instanceof String) {
            fs.readFile(filebuffer, function(err, data) {
                if(err) {
                    fn(err, null)
                } else {
                    let tags = this.getTagsFromBuffer(data, options)
                    fn(null, tags)
                }
            }.bind(this))
        }
    }
}

/*
**  Update ID3-Tags from passed buffer/filepath
**  filebuffer  => Buffer || String
**  tags        => Object
**  fn          => function (for asynchronous usage)
*/
NodeID3.prototype.update = function(tags, filebuffer, fn) {
    let rawTags = {}
    let SRawToNameMap = {}
    Object.keys(SFrames).map((key, index) => {
        SRawToNameMap[SFrames[key].name] = key
    })
    Object.keys(tags).map(function(tagKey) {
        //  if js name passed (TF)
        if(TFrames[tagKey]) {
            rawTags[TFrames[tagKey]] = tags[tagKey]

        //  if js name passed (WF)
        } else if(WFrames[tagKey]) {
            rawTags[WFrames[tagKey].name] = tags[tagKey]

        //  if js name passed (SF)
        } else if(SFrames[tagKey]) {
            rawTags[SFrames[tagKey].name] = tags[tagKey]

        //  if raw name passed (TF)
        } else if(Object.keys(TFrames).map(i => TFrames[i]).indexOf(tagKey) !== -1) {
            rawTags[tagKey] = tags[tagKey]

        //  if raw name passed (WF)
        } else if(Object.keys(WFrames).map(i => WFrames[i]).map(x => x.name).indexOf(tagKey) !== -1) {
            rawTags[tagKey] = tags[tagKey]

        //  if raw name passed (SF)
        } else if(Object.keys(SFrames).map(i => SFrames[i]).map(x => x.name).indexOf(tagKey) !== -1) {
            rawTags[tagKey] = tags[tagKey]
        }
    })
    if(!fn || typeof fn !== 'function') {
        let currentTags = this.read(filebuffer)
        currentTags = currentTags.raw || {}
        //  update current tags with new or keep them
        Object.keys(rawTags).map(function(tag) {
            if(SFrames[SRawToNameMap[tag]] && SFrames[SRawToNameMap[tag]].multiple && currentTags[tag] && rawTags[tag]) {
                const cCompare = {}
                currentTags[tag].forEach((cTag, index) => {
                    cCompare[cTag[SFrames[SRawToNameMap[tag]].updateCompareKey]] = index
                })
                if(!(rawTags[tag] instanceof Array)) rawTags[tag] = [rawTags[tag]]
                rawTags[tag].forEach((rTag, index) => {
                    let comparison = cCompare[rTag[SFrames[SRawToNameMap[tag]].updateCompareKey]]
                    if(comparison !== undefined) {
                        currentTags[tag][comparison] = rTag
                    } else {
                        currentTags[tag].push(rTag)
                    }
                })
            } else {
                currentTags[tag] = rawTags[tag]
            }
        })
        return this.write(currentTags, filebuffer)
    } else {
        this.read(filebuffer, function(err, currentTags) {
            if(err) {
                fn(err)
                return
            }
            currentTags = currentTags.raw || {}
            //  update current tags with new or keep them
            Object.keys(rawTags).map(function(tag) {
                if(SFrames[SRawToNameMap[tag]] && SFrames[SRawToNameMap[tag]].multiple && currentTags[tag] && rawTags[tag]) {
                    const cCompare = {}
                    currentTags[tag].forEach((cTag, index) => {
                        cCompare[cTag[SFrames[SRawToNameMap[tag]].updateCompareKey]] = index
                    })
                    if(!(rawTags[tag] instanceof Array)) rawTags[tag] = [rawTags[tag]]
                    rawTags[tag].forEach((rTag, index) => {
                        let comparison = cCompare[rTag[SFrames[SRawToNameMap[tag]].updateCompareKey]]
                        if(comparison !== undefined) {
                            currentTags[tag][comparison] = rTag
                        } else {
                            currentTags[tag].push(rTag)
                        }
                    })
                } else {
                    currentTags[tag] = rawTags[tag]
                }
            })
            this.write(currentTags, filebuffer, fn)
        }.bind(this))
    }
}

/*
**  Read ID3-Tags from passed buffer
**  filebuffer  => Buffer
**  options     => Object
*/
NodeID3.prototype.getTagsFromBuffer = function(filebuffer, options) {
    let framePosition = this.getFramePosition(filebuffer)
    if(framePosition === -1) {
        return false
    }
    let frameSize = this.getTagSize(Buffer.from(filebuffer.toString('hex', framePosition, framePosition + 10), "hex")) + 10
    let ID3Frame = Buffer.alloc(frameSize + 1)
    let ID3FrameBody = Buffer.alloc(frameSize - 10 + 1)
    filebuffer.copy(ID3Frame, 0, framePosition)
    filebuffer.copy(ID3FrameBody, 0, framePosition + 10)

    //ID3 version e.g. 3 if ID3v2.3.0
    let ID3Version = ID3Frame[3]
    let identifierSize = 4
    let textframeHeaderSize = 10
    if(ID3Version === 2) {
        identifierSize = 3
        textframeHeaderSize = 6
    }

    let frames = this.getFramesFromID3Body(ID3FrameBody, ID3Version, identifierSize, textframeHeaderSize)

    return this.getTagsFromFrames(frames, ID3Version)
}

NodeID3.prototype.getFramesFromID3Body = function(ID3FrameBody, ID3Version, identifierSize, textframeHeaderSize) {
    let currentPosition = 0
    let frames = []
    if(!ID3FrameBody || !(ID3FrameBody instanceof Buffer)) {
        return frames
    }
    while(currentPosition < ID3FrameBody.length && ID3FrameBody[currentPosition] !== 0x00) {
        let bodyFrameHeader = Buffer.alloc(textframeHeaderSize)
        ID3FrameBody.copy(bodyFrameHeader, 0, currentPosition)

        let decodeSize = false
        if(ID3Version === 4) {
            decodeSize = true
        }
        let bodyFrameSize = this.getFrameSize(bodyFrameHeader, decodeSize, ID3Version)
        if(bodyFrameSize + 10 > (ID3FrameBody.length - currentPosition)) {
            break
        }
        let bodyFrameBuffer = Buffer.alloc(bodyFrameSize)
        ID3FrameBody.copy(bodyFrameBuffer, 0, currentPosition + textframeHeaderSize)
        //  Size of sub frame + its header
        currentPosition += bodyFrameSize + textframeHeaderSize
        frames.push({
            name: bodyFrameHeader.toString('utf8', 0, identifierSize),
            body: bodyFrameBuffer
        })
    }

    return frames
}

NodeID3.prototype.getTagsFromFrames = function(frames, ID3Version) {
    let tags = { raw: {} }

    frames.forEach(function(frame, index) {
        //  Check first character if frame is text frame
        if(frame.name[0] === "T" && frame.name !== "TXXX") {
            //  Decode body
            const decoded = iconv.decode(frame.body.slice(1), this.getEncodingName(frame.body[0])).replace(/\0/g, "")
            tags.raw[frame.name] = decoded
            let versionFrames = TFrames
            if(ID3Version === 2) {
                versionFrames = TFramesV220
            }
            Object.keys(versionFrames).map(function(key) {
                if(versionFrames[key] === frame.name) {
                    tags[key] = decoded
                }
            })
        } else if (frame.name[0] === "W" && frame.name !== "WXXX") {
            let versionFrames = WFrames
            if(ID3Version === 2) {
                versionFrames = WFramesV220
            }
            Object.keys(versionFrames).map(function(key) {
                if(versionFrames[key].name === frame.name) {
                    //  URL fields contain no encoding byte and are always ISO-8859-1 as per spec
                    let decoded = iconv.decode(frame.body, "ISO-8859-1").replace(/\0/g, "")
                    if(versionFrames[key].multiple) {
                        if(!tags[key]) tags[key] = []
                        if(!tags.raw[frame.name]) tags.raw[frame.name] = []
                        tags.raw[frame.name].push(decoded)
                        tags[key].push(decoded)
                    } else {
                        tags.raw[frame.name] = decoded
                        tags[key] = decoded
                    }
                }
            })
        } else {
            let versionFrames = SFrames
            if(ID3Version === 2) {
                versionFrames = SFramesV220
            }
            //  Check if non-text frame is supported
            Object.keys(versionFrames).map(function(key) {
                if(versionFrames[key].name === frame.name) {
                    let decoded = this[versionFrames[key].read](frame.body, ID3Version)
                    if(versionFrames[key].multiple) {
                        if(!tags[key]) tags[key] = []
                        if(!tags.raw[frame.name]) tags.raw[frame.name] = []
                        tags.raw[frame.name].push(decoded)
                        tags[key].push(decoded)
                    } else {
                        tags.raw[frame.name] = decoded
                        tags[key] = decoded
                    }
                }
            }.bind(this))
        }
    }.bind(this))

    return tags
}

/*
**  Get position of ID3-Frame, returns -1 if not found
**  buffer  => Buffer
*/
NodeID3.prototype.getFramePosition = function(buffer) {
    let framePosition = buffer.indexOf("ID3")
    if(framePosition === -1 || framePosition > 20) {
        return -1
    } else {
        return framePosition
    }
}

/*
**  Get size of tag from header
**  buffer  => Buffer/Array (header)
*/
NodeID3.prototype.getTagSize = function(buffer) {
    return this.decodeSize(Buffer.from([buffer[6], buffer[7], buffer[8], buffer[9]]))
}

/*
**  Get size of frame from header
**  buffer  => Buffer/Array (header)
**  decode  => Boolean
*/
NodeID3.prototype.getFrameSize = function(buffer, decode, ID3Version) {
    let decodeBytes
    if(ID3Version > 2) {
        decodeBytes = [buffer[4], buffer[5], buffer[6], buffer[7]]
    } else {
        decodeBytes = [buffer[3], buffer[4], buffer[5]]
    }
    if(decode) {
        return this.decodeSize(Buffer.from(decodeBytes))
    } else {
        return Buffer.from(decodeBytes).readUIntBE(0, decodeBytes.length)
    }
}

/*
**  Checks and removes already written ID3-Frames from a buffer
**  data => buffer
*/
NodeID3.prototype.removeTagsFromBuffer = function(data) {
    let framePosition = this.getFramePosition(data)

    if(framePosition === -1) {
        return data
    }

    let hSize = Buffer.from([data[framePosition + 6], data[framePosition + 7], data[framePosition + 8], data[framePosition + 9]])

    if ((hSize[0] | hSize[1] | hSize[2] | hSize[3]) & 0x80) {
        //  Invalid tag size (msb not 0)
        return false
    }

    if(data.length >= framePosition + 10) {
        const size = this.decodeSize(data.slice(framePosition + 6, framePosition + 10))
        return Buffer.concat([data.slice(0, framePosition), data.slice(framePosition + size + 10)])
    } else {
        return data
    }
}

/*
**  Checks and removes already written ID3-Frames from a file
**  data => buffer
*/
NodeID3.prototype.removeTags = function(filepath, fn) {
    if(!fn || typeof fn !== 'function') {
        let data
        try {
            data = fs.readFileSync(filepath)
        } catch(e) {
            return e
        }

        let newData = this.removeTagsFromBuffer(data)
        if(!newData) {
            return false
        }

        try {
            fs.writeFileSync(filepath, newData, 'binary')
        } catch(e) {
            return e
        }

        return true
    } else {
        fs.readFile(filepath, function(err, data) {
            if(err) {
                fn(err)
            }

            let newData = this.removeTagsFromBuffer(data)
            if(!newData) {
                fn(err)
                return
            }

            fs.writeFile(filepath, newData, 'binary', function(err) {
                if(err) {
                    fn(err)
                } else {
                    fn(false)
                }
            })
        }.bind(this))
    }
}

/*
**  This function ensures that the msb of each byte is 0
**  totalSize => int
*/
NodeID3.prototype.encodeSize = function(totalSize) {
    let byte_3 = totalSize & 0x7F
    let byte_2 = (totalSize >> 7) & 0x7F
    let byte_1 = (totalSize >> 14) & 0x7F
    let byte_0 = (totalSize >> 21) & 0x7F
    return ([byte_0, byte_1, byte_2, byte_3])
}


/*
**  This function decodes the 7-bit size structure
**  hSize => int
*/
NodeID3.prototype.decodeSize = function(hSize) {
    return ((hSize[0] << 21) + (hSize[1] << 14) + (hSize[2] << 7) + (hSize[3]))
}

/*
**  Create header for ID3-Frame v2.3.0
*/
NodeID3.prototype.createTagHeader = function() {
    let header = Buffer.alloc(10)
    header.fill(0)
    header.write("ID3", 0)              //File identifier
    header.writeUInt16BE(0x0300, 3)     //Version 2.3.0  --  03 00
    header.writeUInt16BE(0x0000, 5)     //Flags 00

    //Last 4 bytes are used for header size, but have to be inserted later, because at this point, its size is not clear.

    return header
}

/*
** Create text frame
** specName =>  string (ID)
** text     =>  string (body)
*/
NodeID3.prototype.createTextFrame = function(specName, text) {
    if(!specName || !text) {
        return null
    }

    return new ID3FrameBuilder(specName)
        .appendStaticNumber(0x01, 0x01)
        .appendStaticValue(text, null, 0x01)
        .getBuffer()
}

/*
** Create URL frame
** specName =>  string (ID)
** text     =>  string (body)
*/
NodeID3.prototype.createUrlFrame = function(specName, text) {
    if(!specName || !text) {
        return null
    }

    return new ID3FrameBuilder(specName)
        .appendStaticValue(text)
        .getBuffer()
}

/*
**  data => string || buffer
*/
NodeID3.prototype.createPictureFrame = function(data) {
    try {
        if (data instanceof Buffer) {
            data = {
                imageBuffer: Buffer.from(data)
            }
        } else if (typeof data === 'string' || data instanceof String) {
            data = {
                imageBuffer: Buffer.from(fs.readFileSync(data, 'binary'), 'binary')
            }
        } else if (!data.imageBuffer) {
            return Buffer.alloc(0)
        }

        let mime_type = data.mime

        if(!data.mime) {
            if (data.imageBuffer[0] === 0xff && data.imageBuffer[1] === 0xd8 && data.imageBuffer[2] === 0xff) {
                mime_type = "image/jpeg"
            } else {
                mime_type = "image/png"
            }
        }

        return new ID3FrameBuilder("APIC")
            .appendStaticNumber(0x01, 1)
            .appendNullTerminatedValue(mime_type)
            .appendStaticNumber(0x03, 1)
            .appendNullTerminatedValue(data.description, 0x01)
            .appendStaticValue(data.imageBuffer)
            .getBuffer()
    } catch(e) {
        return e
    }
}

/*
**  data => buffer
*/
NodeID3.prototype.readPictureFrame = function(frame, ID3Version) {
    const reader = new ID3FrameReader(frame, 0)
    let mime
    if(ID3Version === 2) {
        mime = reader.consumeStaticValue('string', 3, 0x00)
    } else {
        mime = reader.consumeNullTerminatedValue('string', 0x00)
    }
    if(mime === "image/jpeg") {
        mime = "jpeg"
    } else if(mime === "image/png") {
        mime = "png"
    }

    const typeId = reader.consumeStaticValue('number', 1)
    const description = reader.consumeNullTerminatedValue('string')
    const imageBuffer = reader.consumeStaticValue()

    return {
        mime: mime,
        type: {
            id: typeId,
            name: APICTypes[typeId]
        },
        description: description,
        imageBuffer: imageBuffer
    }
}

NodeID3.prototype.getEncodingName = function(byte) {
    if(byte > -1 && byte < ENCODINGS.length) {
        return ENCODINGS[byte]
    } else {
        return ENCODINGS[0]
    }
}

/*
**  comment => object {
**      language:   string (3 characters),
**      text:       string
**      shortText:  string
**  }
**/
NodeID3.prototype.createCommentFrame = function(comment) {
    comment = comment || {}
    if(!comment.text) {
        return null
    }

    return new ID3FrameBuilder("COMM")
        .appendStaticNumber(0x01, 1)
        .appendStaticValue(comment.language)
        .appendNullTerminatedValue(comment.shortText, 0x01)
        .appendStaticValue(comment.text, null, 0x01)
        .getBuffer()
}

/*
**  frame   => Buffer
*/
NodeID3.prototype.readCommentFrame = function(frame) {
    const reader = new ID3FrameReader(frame, 0)

    return {
        language: reader.consumeStaticValue('string', 3, 0x00),
        shortText: reader.consumeNullTerminatedValue('string'),
        text: reader.consumeStaticValue('string', null)
    }
}

/*
**  unsynchronisedLyrics => object {
**      language:   string (3 characters),
**      text:       string
**      shortText:  string
**  }
**/
NodeID3.prototype.createUnsynchronisedLyricsFrame = function(unsynchronisedLyrics) {
    unsynchronisedLyrics = unsynchronisedLyrics || {}
    if(typeof unsynchronisedLyrics === 'string' || unsynchronisedLyrics instanceof String) {
        unsynchronisedLyrics = {
            text: unsynchronisedLyrics
        }
    }
    if(!unsynchronisedLyrics.text) {
        return null
    }

    return new ID3FrameBuilder("USLT")
        .appendStaticNumber(0x01, 1)
        .appendStaticValue(unsynchronisedLyrics.language)
        .appendNullTerminatedValue(unsynchronisedLyrics.shortText, 0x01)
        .appendStaticValue(unsynchronisedLyrics.text, null, 0x01)
        .getBuffer()
}

/*
**  frame   => Buffer
*/
NodeID3.prototype.readUnsynchronisedLyricsFrame = function(frame) {
    const reader = new ID3FrameReader(frame, 0)

    return {
        language: reader.consumeStaticValue('string', 3, 0x00),
        shortText: reader.consumeNullTerminatedValue('string'),
        text: reader.consumeStaticValue('string', null)
    }
}

/*
**  comment => object / array of objects {
**      description:    string
**      value:          string
**  }
**/
NodeID3.prototype.createUserDefinedText = function(userDefinedText, recursiveBuffer) {
    if(!(userDefinedText instanceof Array)) {
        userDefinedText = [userDefinedText]
    }

    return Buffer.concat(userDefinedText.map(udt => new ID3FrameBuilder("TXXX")
        .appendStaticNumber(0x01, 1)
        .appendNullTerminatedValue(udt.description, 0x01)
        .appendStaticValue(udt.value, null, 0x01)
        .getBuffer()))
}

/*
**  frame   => Buffer
*/
NodeID3.prototype.readUserDefinedText = function(frame) {
    const reader = new ID3FrameReader(frame, 0)

    return {
        description: reader.consumeNullTerminatedValue('string'),
        value: reader.consumeStaticValue('string')
    }
}

/*
**  popularimeter => object {
**      email:    string,
**      rating:   int
**      counter:  int
**  }
**/
NodeID3.prototype.createPopularimeterFrame = function(popularimeter = {}) {
    const email = popularimeter.email
    let rating = Math.trunc(popularimeter.rating)
    let counter = Math.trunc(popularimeter.counter)
    if(!email) {
        return null
    }
    if(isNaN(rating) || rating < 0 || rating > 255) {
        rating = 0
    }
    if(isNaN(counter) || counter < 0) {
        counter = 0
    }

    return new ID3FrameBuilder("POPM")
        .appendNullTerminatedValue(email)
        .appendStaticNumber(rating, 1)
        .appendStaticNumber(counter, 4)
        .getBuffer()
}

/*
**  frame   => Buffer
*/
NodeID3.prototype.readPopularimeterFrame = function(frame) {
    const reader = new ID3FrameReader(frame)
    return {
        email: reader.consumeNullTerminatedValue('string'),
        rating: reader.consumeStaticValue('number', 1),
        counter: reader.consumeStaticValue('number')
    }
}

/*
**  _private => object|array {
**      ownerIdentifier:    string,
**      data:   buffer|string
**  }
**/
NodeID3.prototype.createPrivateFrame = function(_private = []) {
    if(!(_private instanceof Array)) {
        _private = [_private]
    }

    return Buffer.concat(_private.map(priv => new ID3FrameBuilder("PRIV")
        .appendNullTerminatedValue(priv.ownerIdentifier)
        .appendStaticValue(priv.data instanceof Buffer ? priv.data : Buffer.from(priv.data, "utf8"))
        .getBuffer()))
}

/*
**  frame   => Buffer
*/
NodeID3.prototype.readPrivateFrame = function(frame) {
    const reader = new ID3FrameReader(frame)
    return {
        ownerIdentifier: reader.consumeNullTerminatedValue('string'),
        data: reader.consumeStaticValue()
    }
}


/**
 * @typedef {Object} Chapter
 * @property {string} elementID
 * @property {number} startTimeMs
 * @property {number} endTimeMs
 * @property {number} [startOffsetBytes]
 * @property {number} [endOffsetBytes]
 * @property {object} [tags]
 */
NodeID3.prototype.createChapterFrame = function (/** @type Chapter[] | Chapter */chapter = []) {
    if (!(chapter instanceof Array)) {
        chapter = [chapter]
    }

    return Buffer.concat(chapter.map(chap => {
        if (!chap || !chap.elementID || typeof chap.startTimeMs === "undefined" || !chap.endTimeMs) {
            return null
        }
        return new ID3FrameBuilder("CHAP")
            .appendNullTerminatedValue(chap.elementID)
            .appendStaticNumber(chap.startTimeMs, 4)
            .appendStaticNumber(chap.endTimeMs, 4)
            .appendStaticNumber(chap.startOffsetBytes ? chap.startOffsetBytes : 0xFFFFFFFF, 4)
            .appendStaticNumber(chap.endOffsetBytes ? chap.endOffsetBytes : 0xFFFFFFFF, 4)
            .appendStaticValue(this.create(chap.tags).slice(10))
            .getBuffer()
    }).filter(chap => chap instanceof Buffer))
}

/*
**  frame   => Buffer
*/
NodeID3.prototype.readChapterFrame = function(frame) {
    const reader = new ID3FrameReader(frame)
    let chap = {
        elementID: reader.consumeNullTerminatedValue('string'),
        startTimeMs: reader.consumeStaticValue('number', 4),
        endTimeMs: reader.consumeStaticValue('number', 4),
        startOffsetBytes: reader.consumeStaticValue('number', 4),
        endOffsetBytes: reader.consumeStaticValue('number', 4),
        tags: this.getTagsFromFrames(this.getFramesFromID3Body(reader.consumeStaticValue(), 3, 4, 10), 3)
    }
    if(chap.startOffsetBytes === 0xFFFFFFFF) delete chap.startOffsetBytes
    if(chap.endOffsetBytes === 0xFFFFFFFF) delete chap.endOffsetBytes
    return chap
}

/* TODO: CREATE TESTS */
NodeID3.prototype.createTableOfContentsFrame = function (tableOfContents = []) {
    if(!(tableOfContents instanceof Array)) {
        tableOfContents = [tableOfContents]
    }

    return Buffer.concat(tableOfContents.map((toc, index) => {
        if(!toc || !toc.elementID) {
            return null
        }
        if(!(toc.elements instanceof Array)) {
            toc.elements = []
        }

        let ctocFlags = Buffer.alloc(1, 0)
        if(index === 0) {
            ctocFlags[0] += 2
        }
        if(toc.isOrdered) {
            ctocFlags[0] += 1
        }

        const builder = new ID3FrameBuilder("CTOC")
            .appendNullTerminatedValue(toc.elementID)
            .appendStaticValue(ctocFlags, 1)
            .appendStaticNumber(toc.elements.length, 1)
        toc.elements.forEach((el) => {
            builder.appendNullTerminatedValue(el)
        })
        if(toc.tags) {
            builder.appendStaticValue(this.create(toc.tags).slice(10))
        }
        return builder.getBuffer()
    }).filter((toc) => toc instanceof Buffer))
}

NodeID3.prototype.readTableOfContentsFrame = function(frame) {
    const reader = new ID3FrameReader(frame)
    const elementID = reader.consumeNullTerminatedValue('string')
    const flags = reader.consumeStaticValue('number', 1)
    const entries = reader.consumeStaticValue('number', 1)
    const elements = []
    for(let i = 0; i < entries; i++) {
        elements.push(reader.consumeNullTerminatedValue('string'))
    }
    const tags = this.getTagsFromFrames(this.getFramesFromID3Body(reader.consumeStaticValue(), 3, 4, 10), 3)

    return {
        elementID,
        isOrdered: !!(flags & 0x01 === 0x01),
        elements,
        tags
    }
}

NodeID3.prototype.createUserDefinedUrl = function(userDefinedUrl) {
    if(!(userDefinedUrl instanceof Array)) {
        userDefinedUrl = [userDefinedUrl]
    }

    return Buffer.concat(userDefinedUrl.map((udu) => {
        return new ID3FrameBuilder("WXXX")
            .appendStaticNumber(0x01, 1)
            .appendNullTerminatedValue(udu.description, 0x01)
            .appendStaticValue(udu.url, null)
            .getBuffer()
    }))
}

NodeID3.prototype.readUserDefinedUrl = function(frame) {
    const reader = new ID3FrameReader(frame, 0)

    return {
        description: reader.consumeNullTerminatedValue('string'),
        url: reader.consumeStaticValue('string', null, 0x00)
    }
}

module.exports.Promise = {
    write: (tags, file) => {
        return new Promise((resolve, reject) => {
            new NodeID3().write(tags, file, (err, ret) => {
                if(err) reject(err)
                else resolve(ret)
            })
        })
    },
    update: (tags, file) => {
        return new Promise((resolve, reject) => {
            new NodeID3().update(tags, file, (err, ret) => {
                if(err) reject(err)
                else resolve(ret)
            })
        })
    },
    create: (tags) => {
        return new Promise((resolve) => {
            new NodeID3().create(tags, (buffer) => {
                resolve(buffer)
            })
        })
    },
    read: (file) => {
        return new Promise((resolve, reject) => {
            new NodeID3().read(file, (err, ret) => {
                if(err) reject(err)
                else resolve(ret)
            })
        })
    },
    removeTags: (filepath) => {
        return new Promise((resolve, reject) => {
            new NodeID3().removeTags(filepath, (err) => {
                if(err) reject(err)
                else resolve()
            })
        })
    }
}
