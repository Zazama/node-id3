const fs = require('fs')
const iconv = require("iconv-lite")

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
    userDefinedUrl: {
        create: "createUserDefinedUrl",
        read: "readUserDefinedUrl",
        name: "WXXX",
        multiple: true,
        updateCompareKey: "description"
    }
}

const SFramesV220 = {
    image: {
        create: "createPictureFrame",
        read: "readPictureFrame",
        name: "PIC"
    }
}

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

NodeID3.prototype.createBuffersFromTags = function(tags) {
    let frames = []
    let tagNames = Object.keys(tags)

    tagNames.forEach(function (tag, index) {
        //  Check if passed tag is text frame (Alias or ID)
        let frame
        if (TFrames[tag] || Object.keys(TFrames).map(i => TFrames[i]).indexOf(tag) != -1) {
            let specName = TFrames[tag] || tag
            frame = this.createTextFrame(specName, tags[tag])
        } else if (WFrames[tag] || Object.keys(WFrames).map(i => WFrames[i]).map(x => x.name).indexOf(tag) !== -1) {
            let specName = WFrames[tag] ? WFrames[tag].name : tag
            let multiple = WFrames[Object.keys(WFrames)[Object.keys(WFrames).map(i => WFrames[i]).map(x => x.name).indexOf(specName)]].multiple
            if(multiple && tags[tag] instanceof Array && tags[tag].length > 0) {
                frame = Buffer.alloc(0);
                // deduplicate array
                for(var url of [...new Set(tags[tag])]) {
                    frame = Buffer.concat([frame, this.createUrlFrame(specName, url)])
                }
            } else {
                frame = this.createUrlFrame(specName, tags[tag])
            }
        } else if (SFrames[tag]) {  //  Check if Alias of special frame
            let createFrameFunction = SFrames[tag].create
            frame = this[createFrameFunction](tags[tag])
        } else if (Object.keys(SFrames).map(i => SFrames[i]).map(x => x.name).indexOf(tag) != -1) {  //  Check if ID of special frame
            //  get create function from special frames where tag ID is found at SFrame[index].name
            let createFrameFunction = SFrames[Object.keys(SFrames)[Object.keys(SFrames).map(i => SFrames[i]).map(x => x.name).indexOf(tag)]].create
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
    if(ID3Version == 2) {
        identifierSize = 3
        textframeHeaderSize = 6
    }

    let frames = this.getFramesFromID3Body(ID3FrameBody, ID3Version, identifierSize, textframeHeaderSize)

    return this.getTagsFromFrames(frames, ID3Version)
}

NodeID3.prototype.getFramesFromID3Body = function(ID3FrameBody, ID3Version, identifierSize, textframeHeaderSize) {
    let currentPosition = 0
    let frames = []
    while(currentPosition < ID3FrameBody.length && ID3FrameBody[currentPosition] !== 0x00) {
        let bodyFrameHeader = Buffer.alloc(textframeHeaderSize)
        ID3FrameBody.copy(bodyFrameHeader, 0, currentPosition)

        let decodeSize = false
        if(ID3Version == 4) {
            decodeSize = true
        }
        let bodyFrameSize = this.getFrameSize(bodyFrameHeader, decodeSize, ID3Version)
        if(bodyFrameSize > (ID3FrameBody.length - currentPosition)) {
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
            let decoded
            if(frame.body[0] === 0x01) {
                decoded = iconv.decode(frame.body.slice(1), "utf16").replace(/\0/g, "")
            } else {
                decoded = iconv.decode(frame.body.slice(1), "ISO-8859-1").replace(/\0/g, "")
            }
            tags.raw[frame.name] = decoded
            let versionFrames = TFrames
            if(ID3Version == 2) {
                versionFrames = TFramesV220
            }
            Object.keys(versionFrames).map(function(key) {
                if(versionFrames[key] === frame.name) {
                    tags[key] = decoded
                }
            })
        } else if (frame.name[0] === "W" && frame.name !== "WXXX") {
            let versionFrames = WFrames
            if(ID3Version == 2) {
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
            if(ID3Version == 2) {
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
    if(framePosition == -1 || framePosition > 20) {
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

    if(framePosition == -1) {
        return data
    }

    let hSize = Buffer.from([data[framePosition + 6], data[framePosition + 7], data[framePosition + 8], data[framePosition + 9]])

    if ((hSize[0] | hSize[1] | hSize[2] | hSize[3]) & 0x80) {
        //  Invalid tag size (msb not 0)
        return false
    }

    let size = this.decodeSize(hSize)
    return data.slice(framePosition + size + 10)
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

    let encoded = iconv.encode(text, "utf16")

    let buffer = Buffer.alloc(10)
    buffer.fill(0)
    buffer.write(specName, 0)                           //  ID of the specified frame
    buffer.writeUInt32BE((encoded).length + 1, 4)       //  Size of frame (string length + encoding byte)
    let encBuffer = Buffer.alloc(1)                       //  Encoding (now using UTF-16 encoded w/ BOM)
    encBuffer.fill(1)                                   //  UTF-16

    var contentBuffer = Buffer.from(encoded, 'binary')   //  Text -> Binary encoding for UTF-16 w/ BOM
    return Buffer.concat([buffer, encBuffer, contentBuffer])
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

    let encoded = iconv.encode(text, "ISO-8859-1")

    let buffer = Buffer.alloc(10)
    buffer.fill(0)
    buffer.write(specName, 0)                           //  ID of the specified frame
    buffer.writeUInt32BE((encoded).length + 1, 4)       //  Size of frame (string length + encoding byte)
    let encBuffer = Buffer.alloc(1)                       //  Encoding (URLs are always ISO-8859-1)
    encBuffer.fill(0)                                   //  ISO-8859-1

    var contentBuffer = Buffer.from(encoded, 'binary')   //  Text -> Binary encoding for ISO-8859-1
    return Buffer.concat([buffer, encBuffer, contentBuffer])
}

/*
**  data => string || buffer
*/
NodeID3.prototype.createPictureFrame = function(data) {
    try {
        if(data && data.imageBuffer && data.imageBuffer instanceof Buffer === true) {
            data = data.imageBuffer
        }
        let apicData = (data instanceof Buffer == true) ? Buffer.from(data) : Buffer.from(fs.readFileSync(data, 'binary'), 'binary')
        let bHeader = Buffer.alloc(10)
        bHeader.fill(0)
        bHeader.write("APIC", 0)

    	let mime_type = "image/png"

        if(apicData[0] == 0xff && apicData[1] == 0xd8 && apicData[2] == 0xff) {
            mime_type = "image/jpeg"
        }

        let bContent = Buffer.alloc(mime_type.length + 4)
        bContent.fill(0)
        bContent[mime_type.length + 2] = 0x03                           //  Front cover
        bContent.write(mime_type, 1)

    	bHeader.writeUInt32BE(apicData.length + bContent.length, 4)     //  Size of frame

        return Buffer.concat([bHeader, bContent, apicData])
    } catch(e) {
        return e
    }
}

/*
**  data => buffer
*/
NodeID3.prototype.readPictureFrame = function(APICFrame, ID3Version) {
    let picture = {}

    let APICMimeType
    if(ID3Version == 2) {
        APICMimeType = APICFrame.toString('ascii').substring(1, 4)
    } else {
        APICMimeType = APICFrame.toString('ascii').substring(1, APICFrame.indexOf(0x00, 1))
    }

    if(APICMimeType == "image/jpeg") {
        picture.mime = "jpeg"
    } else if(APICMimeType == "image/png") {
        picture.mime = "png"
    } else {
        picture.mime = APICMimeType
    }

    picture.type = {}
    if(ID3Version == 2 && APICTypes.length < APICFrame[4]) {
        picture.type = {
            id: APICFrame[4],
            name: APICTypes[APICFrame[4]]
        }
    } else {
        picture.type = {
            id: APICFrame[APICFrame.indexOf(0x00, 1) + 1],
            name: APICTypes[APICFrame[APICFrame.indexOf(0x00, 1) + 1]]
        }
    }

    let descEnd
    if(APICFrame[0] == 0x00) {
        if(ID3Version == 2) {
            picture.description = iconv.decode(APICFrame.slice(5, APICFrame.indexOf(0x00, 5)), "ISO-8859-1") || undefined
            descEnd = APICFrame.indexOf(0x00, 5)
        } else {
            picture.description = iconv.decode(APICFrame.slice(APICFrame.indexOf(0x00, 1) + 2, APICFrame.indexOf(0x00, APICFrame.indexOf(0x00, 1) + 2)), "ISO-8859-1") || undefined
            descEnd = APICFrame.indexOf(0x00, APICFrame.indexOf(0x00, 1) + 2)
        }
    } else if (APICFrame[0] == 0x01) {
        if(ID3Version == 2) {
            let descOffset = 5
            let desc = APICFrame.slice(descOffset)
            let descFound = desc.indexOf("0000", 0, 'hex')
            descEnd = descOffset + descFound + 2

            if(descFound != -1) {
                picture.description = iconv.decode(desc.slice(0, descFound + 2), 'utf16') || undefined
            }
        } else {
            let descOffset = APICFrame.indexOf(0x00, 1) + 2
            let desc = APICFrame.slice(descOffset)
            let descFound = desc.indexOf("0000", 0, 'hex')
            descEnd = descOffset + descFound + 2

            if(descFound != -1) {
                picture.description = iconv.decode(desc.slice(0, descFound + 2), 'utf16') || undefined
            }
        }
    }
    if(descEnd) {
        picture.imageBuffer = APICFrame.slice(descEnd + 1)
    } else {
        picture.imageBuffer = APICFrame.slice(5)
    }

    return picture
}

NodeID3.prototype.getEncodingByte = function(encoding) {
    if(!encoding || encoding === 0x00 || encoding === "ISO-8859-1") {
        return 0x00
    } else {
        return 0x01
    }
}

NodeID3.prototype.getEncodingName = function(encoding) {
    if(this.getEncodingByte(encoding) === 0x00) {
        return "ISO-8859-1"
    } else {
        return "utf16"
    }
}

NodeID3.prototype.getTerminationCount = function(encoding) {
    if(encoding === 0x00) {
        return 1
    } else {
        return 2
    }
}

NodeID3.prototype.createTextEncoding = function(encoding) {
    let buffer = Buffer.alloc(1)
    buffer[0] = this.getEncodingByte(encoding)
    return buffer
}

NodeID3.prototype.createLanguage = function(language) {
    if(!language) {
        language = "eng"
    } else if(language.length > 3) {
        language = language.substring(0, 3)
    }

    return Buffer.from(language)
}

NodeID3.prototype.createContentDescriptor = function(description, encoding, terminated) {
    if(!description) {
        description = terminated ? iconv.encode("\0", this.getEncodingName(encoding)) : Buffer.alloc(0)
        return description
    }

    description = iconv.encode(description, this.getEncodingName(encoding))

    return terminated ? Buffer.concat([description, Buffer.alloc(this.getTerminationCount(encoding)).fill(0x00)]) : description
}

NodeID3.prototype.createText = function(text, encoding, terminated) {
    if(!text) {
        text = ""
    }

    text = iconv.encode(text, this.getEncodingName(encoding))

    return terminated ? Buffer.concat([text, Buffer.from(this.getTerminationCount(encoding)).fill(0x00)]) : text
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

    // Create frame header
    let buffer = Buffer.alloc(10)
    buffer.fill(0)
    buffer.write("COMM", 0)                 //  Write header ID

    let encodingBuffer = this.createTextEncoding(0x01)
    let languageBuffer = this.createLanguage(comment.language)
    let descriptorBuffer = this.createContentDescriptor(comment.shortText, 0x01, true)
    let textBuffer = this.createText(comment.text, 0x01, false)

    buffer.writeUInt32BE(encodingBuffer.length + languageBuffer.length + descriptorBuffer.length + textBuffer.length, 4)
    return Buffer.concat([buffer, encodingBuffer, languageBuffer, descriptorBuffer, textBuffer])
}

/*
**  frame   => Buffer
*/
NodeID3.prototype.readCommentFrame = function(frame) {
    let tags = {}

    if(!frame) {
        return tags
    }
    if(frame[0] == 0x00) {
        tags = {
            language: iconv.decode(frame, "ISO-8859-1").substring(1, 4).replace(/\0/g, ""),
            shortText: iconv.decode(frame, "ISO-8859-1").substring(4, frame.indexOf(0x00, 1)).replace(/\0/g, ""),
            text: iconv.decode(frame, "ISO-8859-1").substring(frame.indexOf(0x00, 1) + 1).replace(/\0/g, "")
        }
    } else if(frame[0] == 0x01) {
        let descriptorEscape = 0
        while(frame[descriptorEscape] !== undefined && frame[descriptorEscape] !== 0x00 || frame[descriptorEscape + 1] !== 0x00 || frame[descriptorEscape + 2] === 0x00) {
            descriptorEscape++
        }
        if(frame[descriptorEscape] === undefined) {
            return tags
        }
        let shortText = frame.slice(4, descriptorEscape)
        let text = frame.slice(descriptorEscape + 2)

        tags = {
            language: frame.toString().substring(1, 4).replace(/\0/g, ""),
            shortText: iconv.decode(shortText, "utf16").replace(/\0/g, ""),
            text: iconv.decode(text, "utf16").replace(/\0/g, "")
        }
    }

    return tags
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

    // Create frame header
    let buffer = Buffer.alloc(10)
    buffer.fill(0)
    buffer.write("USLT", 0)                 //  Write header ID

    let encodingBuffer = this.createTextEncoding(0x01)
    let languageBuffer = this.createLanguage(unsynchronisedLyrics.language)
    let descriptorBuffer = this.createContentDescriptor(unsynchronisedLyrics.shortText, 0x01, true)
    let textBuffer = this.createText(unsynchronisedLyrics.text, 0x01, false)

    buffer.writeUInt32BE(encodingBuffer.length + languageBuffer.length + descriptorBuffer.length + textBuffer.length, 4)
    return Buffer.concat([buffer, encodingBuffer, languageBuffer, descriptorBuffer, textBuffer])
}

/*
**  frame   => Buffer
*/
NodeID3.prototype.readUnsynchronisedLyricsFrame = function(frame) {
    let tags = {}

    if(!frame) {
        return tags
    }
    if(frame[0] == 0x00) {
        tags = {
            language: iconv.decode(frame, "ISO-8859-1").substring(1, 4).replace(/\0/g, ""),
            shortText: iconv.decode(frame, "ISO-8859-1").substring(4, frame.indexOf(0x00, 1)).replace(/\0/g, ""),
            text: iconv.decode(frame, "ISO-8859-1").substring(frame.indexOf(0x00, 1) + 1).replace(/\0/g, "")
        }
    } else if(frame[0] == 0x01) {
        let descriptorEscape = 0
        while(frame[descriptorEscape] !== undefined && frame[descriptorEscape] !== 0x00 || frame[descriptorEscape + 1] !== 0x00 || frame[descriptorEscape + 2] === 0x00) {
            descriptorEscape++
        }
        if(frame[descriptorEscape] === undefined) {
            return tags
        }
        let shortText = frame.slice(4, descriptorEscape)
        let text = frame.slice(descriptorEscape + 2)

        tags = {
            language: frame.toString().substring(1, 4).replace(/\0/g, ""),
            shortText: iconv.decode(shortText, "utf16").replace(/\0/g, ""),
            text: iconv.decode(text, "utf16").replace(/\0/g, "")
        }
    }

    return tags
}

/*
**  comment => object / array of objects {
**      description:    string
**      value:          string
**  }
**/
NodeID3.prototype.createUserDefinedText = function(userDefinedText, recursiveBuffer) {
    let udt = userDefinedText || {}
    if(udt instanceof Array && udt.length > 0) {
        if(!recursiveBuffer) {
            // Don't alter passed array value!
            userDefinedText = userDefinedText.slice(0)
        }
        udt = userDefinedText.pop()
    }

    if(udt && udt.description) {
        // Create frame header
        let buffer = Buffer.alloc(10)
        buffer.fill(0)
        buffer.write("TXXX", 0)                 //  Write header ID

        let encodingBuffer = this.createTextEncoding(0x01)
        let descriptorBuffer = this.createContentDescriptor(udt.description, 0x01, true)
        let valueBuffer = this.createText(udt.value, 0x01, false)

        buffer.writeUInt32BE(encodingBuffer.length + descriptorBuffer.length + valueBuffer.length, 4)
        if(!recursiveBuffer) {
            recursiveBuffer = Buffer.concat([buffer, encodingBuffer, descriptorBuffer, valueBuffer])
        } else {
            recursiveBuffer = Buffer.concat([recursiveBuffer, buffer, encodingBuffer, descriptorBuffer, valueBuffer])
        }
    }
    if(userDefinedText instanceof Array && userDefinedText.length > 0) {
        return this.createUserDefinedText(userDefinedText, recursiveBuffer)
    } else {
        return recursiveBuffer
    }
}

/*
**  frame   => Buffer
*/
NodeID3.prototype.readUserDefinedText = function(frame) {
    let tags = {}

    if(!frame) {
        return tags
    }
    if(frame[0] == 0x00) {
        tags = {
            description: iconv.decode(frame, "ISO-8859-1").substring(1, frame.indexOf(0x00, 1)).replace(/\0/g, ""),
            value: iconv.decode(frame, "ISO-8859-1").substring(frame.indexOf(0x00, 1) + 1).replace(/\0/g, "")
        }
    } else if(frame[0] == 0x01) {
        let descriptorEscape = 0
        while(frame[descriptorEscape] !== undefined && frame[descriptorEscape] !== 0x00 || frame[descriptorEscape + 1] !== 0x00 || frame[descriptorEscape + 2] === 0x00) {
            descriptorEscape++
        }
        if(frame[descriptorEscape] === undefined) {
            return tags
        }
        let description = frame.slice(1, descriptorEscape)
        let value = frame.slice(descriptorEscape + 2)

        tags = {
            description: iconv.decode(description, "utf16").replace(/\0/g, ""),
            value: iconv.decode(value, "utf16").replace(/\0/g, "")
        }
    }

    return tags
}

/*
**  popularimeter => object {
**      email:    string,
**      rating:   int
**      counter:  int
**  }
**/
NodeID3.prototype.createPopularimeterFrame = function(popularimeter) {
    popularimeter = popularimeter || {}
    let email = popularimeter.email
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

    // Create frame header
    let buffer = Buffer.alloc(10, 0)
    buffer.write("POPM", 0)                 //  Write header ID

    let emailBuffer = this.createText(email, 0x01, false)
    emailBuffer = Buffer.from(email + '\0', 'utf8')
    let ratingBuffer = Buffer.alloc(1, rating)
    let counterBuffer = Buffer.alloc(4, 0)
    counterBuffer.writeUInt32BE(counter, 0)

    buffer.writeUInt32BE(emailBuffer.length + ratingBuffer.length + counterBuffer.length, 4)
    var frame = Buffer.concat([buffer, emailBuffer, ratingBuffer, counterBuffer])
    return frame
}

/*
**  frame   => Buffer
*/
NodeID3.prototype.readPopularimeterFrame = function(frame) {
    let tags = {}

    if(!frame) {
        return tags
    }
    let endEmailIndex = frame.indexOf(0x00, 1)
    if(endEmailIndex > -1) {
        tags.email = iconv.decode(frame.slice(0, endEmailIndex), "ISO-8859-1")
        let ratingIndex = endEmailIndex + 1
        if(ratingIndex < frame.length) {
            tags.rating = frame[ratingIndex]
            let counterIndex = ratingIndex + 1
            if(counterIndex < frame.length) {
                let value = frame.slice(counterIndex, frame.length)
                if(value.length >= 4) {
                    tags.counter = value.readUInt32BE()
                }
            }
        }
    }
    return tags
}

/*
**  _private => object|array {
**      ownerIdentifier:    string,
**      data:   buffer|string
**  }
**/
NodeID3.prototype.createPrivateFrame = function(_private) {
    if(_private instanceof Array && _private.length > 0) {
        let frames = []
        _private.forEach(tag => {
            let frame = this.createPrivateFrameHelper(tag)
            if(frame) {
                frames.push(frame)
            }
        })
        return frames.length ? Buffer.concat(frames) : null
    } else {
        return this.createPrivateFrameHelper(_private)
    }
}

NodeID3.prototype.createPrivateFrameHelper = function(_private) {
    if(!_private || !_private.ownerIdentifier || !_private.data) {
        return null;
    }
    let header = Buffer.alloc(10, 0)
    header.write("PRIV")
    let ownerIdentifier = Buffer.from(_private.ownerIdentifier + "\0", "utf8")
    let data
    if(typeof(_private.data) == "string") {
        data = Buffer.from(_private.data, "utf8")
    } else {
        data = _private.data
    }

    header.writeUInt32BE(ownerIdentifier.length + data.length, 4)
    return Buffer.concat([header, ownerIdentifier, data])
}

/*
**  frame   => Buffer
*/
NodeID3.prototype.readPrivateFrame = function(frame) {
    let tags = {}

    if(!frame) {
        return tags
    }

    let endOfOwnerIdentification = frame.indexOf(0x00)
    if(endOfOwnerIdentification == -1) {
        return tags
    }

    tags.ownerIdentifier = iconv.decode(frame.slice(0, endOfOwnerIdentification), "ISO-8859-1")

    if(frame.length <= endOfOwnerIdentification + 1) {
        return tags
    }

    tags.data = frame.slice(endOfOwnerIdentification + 1)

    return tags
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
NodeID3.prototype.createChapterFrame = function (/** @type Chapter[] | Chapter */chapter) {
    if(chapter instanceof Array && chapter.length > 0) {
        let frames = []
        chapter.forEach((tag, index) => {
            let frame = this.createChapterFrameHelper(tag, index + 1)
            if(frame) {
                frames.push(frame)
            }
        })
        return frames.length ? Buffer.concat(frames) : null
    } else {
        return this.createChapterFrameHelper(chapter, 1)
    }
}

NodeID3.prototype.createChapterFrameHelper = function(chapter, id) {
    if(!chapter || !chapter.elementID || typeof chapter.startTimeMs === "undefined" || !chapter.endTimeMs) {
        return null
    }

    let header = Buffer.alloc(10, 0)
    header.write("CHAP")

    let elementIDBuffer = Buffer.from(chapter.elementID + "\0")
    let startTimeBuffer = Buffer.alloc(4)
    startTimeBuffer.writeUInt32BE(chapter.startTimeMs, 0)
    let endTimeBuffer = Buffer.alloc(4)
    endTimeBuffer.writeUInt32BE(chapter.endTimeMs, 0)
    let startOffsetBytesBuffer = Buffer.alloc(4, 0xFF)
    if(chapter.startOffsetBytes) {
        startOffsetBytesBuffer.writeUInt32BE(chapter.startOffsetBytes, 0)
    }
    let endOffsetBytesBuffer = Buffer.alloc(4, 0xFF)
    if(chapter.endOffsetBytes) {
        endOffsetBytesBuffer.writeUInt32BE(chapter.endOffsetBytes, 0)
    }

    let frames
    if(chapter.tags) {
        frames = this.createBuffersFromTags(chapter.tags)
    }
    const framesBuffer = frames ? Buffer.concat(frames) : Buffer.alloc(0)

    header.writeUInt32BE(elementIDBuffer.length + 16 + framesBuffer.length, 4)
    return Buffer.concat([header, elementIDBuffer, startTimeBuffer, endTimeBuffer, startOffsetBytesBuffer, endOffsetBytesBuffer, framesBuffer])
}

/*
**  frame   => Buffer
*/
NodeID3.prototype.readChapterFrame = function(frame) {
    let tags = {}

    if(!frame) {
        return tags
    }

    let endOfElementIDString = frame.indexOf(0x00)
    if(endOfElementIDString == -1 || frame.length - endOfElementIDString - 1 < 16) {
        return tags
    }

    tags.elementID = iconv.decode(frame.slice(0, endOfElementIDString), "ISO-8859-1")
    tags.startTimeMs = frame.readUInt32BE(endOfElementIDString + 1)
    tags.endTimeMs = frame.readUInt32BE(endOfElementIDString + 5)
    if(frame.readUInt32BE(endOfElementIDString + 9) != Buffer.alloc(4, 0xff).readUInt32BE(0)) {
        tags.startOffsetBytes = frame.readUInt32BE(endOfElementIDString + 9)
    }
    if(frame.readUInt32BE(endOfElementIDString + 13) != Buffer.alloc(4, 0xff).readUInt32BE(0)) {
        tags.endOffsetBytes = frame.readUInt32BE(endOfElementIDString + 13)
    }

    if(frame.length - endOfElementIDString - 17 > 0) {
        let framesBuffer = frame.slice(endOfElementIDString + 17)
        tags.tags = this.getTagsFromFrames(this.getFramesFromID3Body(framesBuffer, 3, 4, 10), 3)
    }

    return tags
}

NodeID3.prototype.createUserDefinedUrl = function(userDefinedUrl, recursiveBuffer) {
    let udu = userDefinedUrl || {}
    if(udu instanceof Array && udu.length > 0) {
        if(!recursiveBuffer) {
            // Don't alter passed array value!
            userDefinedUrl = userDefinedUrl.slice(0)
        }
        udu = userDefinedUrl.pop()
    }

    if(udu && udu.description) {
        // Create frame header
        let buffer = Buffer.alloc(10)
        buffer.fill(0)
        buffer.write("WXXX", 0)                 //  Write header ID

        let encodingBuffer = this.createTextEncoding(0x01)
        let descriptorBuffer = this.createContentDescriptor(udu.description, 0x01, true)
        let urlBuffer = this.createText(udu.url, 0x00, false)

        buffer.writeUInt32BE(encodingBuffer.length + descriptorBuffer.length + urlBuffer.length, 4)
        if(!recursiveBuffer) {
            recursiveBuffer = Buffer.concat([buffer, encodingBuffer, descriptorBuffer, urlBuffer])
        } else {
            recursiveBuffer = Buffer.concat([recursiveBuffer, buffer, encodingBuffer, descriptorBuffer, urlBuffer])
        }
    }
    if(userDefinedUrl instanceof Array && userDefinedUrl.length > 0) {
        return this.createUserDefinedUrl(userDefinedUrl, recursiveBuffer)
    } else {
        return recursiveBuffer
    }
}

NodeID3.prototype.readUserDefinedUrl = function(frame) {
    let tags = {}

    if(!frame) {
        return tags
    }
    if(frame[0] == 0x00) {
        tags = {
            description: iconv.decode(frame, "ISO-8859-1").substring(1, frame.indexOf(0x00, 1)).replace(/\0/g, ""),
            url: iconv.decode(frame, "ISO-8859-1").substring(frame.indexOf(0x00, 1) + 1).replace(/\0/g, "")
        }
    } else if(frame[0] == 0x01) {
        let descriptorEscape = 0
        while(frame[descriptorEscape] !== undefined && frame[descriptorEscape] !== 0x00 || frame[descriptorEscape + 1] !== 0x00 || frame[descriptorEscape + 2] === 0x00) {
            descriptorEscape++
        }
        if(frame[descriptorEscape] === undefined) {
            return tags
        }
        let description = frame.slice(1, descriptorEscape)
        let value = frame.slice(descriptorEscape + 2)

        tags = {
            description: iconv.decode(description, "utf16").replace(/\0/g, ""),
            url: iconv.decode(value, "ISO-8859-1").replace(/\0/g, "")
        }
    }

    return tags
}
