var fs = require('fs');
var iconv = require("iconv-lite");

module.exports = new NodeID3;

var TIF = {                            //All text information frames
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

var SIF = {
    comment: {
        create: "createCommentFrame",
        read: "readCommentFrame",
        name: "COMM"
    }
}

var APICTypes = [
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

NodeID3.prototype.write = function(tags, filepath) {
    var frames = [];
    frames.push(this.createTagHeader());

    var tagNames = Object.keys(tags);

    for(var i = 0; i < tagNames.length; i++) {
        //Check if TextFrame
        if(TIF[tagNames[i]]) {
            var specName = TIF[tagNames[i]];
            var frame = this.createTextFrame(specName, tags[tagNames[i]]);
            if(frame instanceof Buffer) frames.push(frame);
        } else if (SIF[tagNames[i]]) {
            var frame = this[SIF[tagNames[i]].create]((tags[tagNames[i]]));
            if(frame instanceof Buffer) frames.push(frame);
        }
    }

    if(tags.image) {
        var frame = this.createPictureFrame(tags.image);
        if(frame instanceof Buffer) frames.push(frame);
    }

    var totalSize = 0;
    for(var i = 0; i < frames.length; i++) {
        totalSize += frames[i].length;
    }

    totalSize -= 10;

    var size = encodeSize(totalSize);

    frames[0].writeUInt8(size[0], 6);
    frames[0].writeUInt8(size[1], 7);
    frames[0].writeUInt8(size[2], 8);
    frames[0].writeUInt8(size[3], 9);

    var completeTag = Buffer.concat(frames);

    try {
        var data = fs.readFileSync(filepath);
        data = this.removeTagsFromBuffer(data) || data;
        var rewriteFile = Buffer.concat([completeTag, data]);
        fs.writeFileSync(filepath, rewriteFile, 'binary');
    } catch(e) {
        return e;
    }

    return true;
}

NodeID3.prototype.read = function(filebuffer) {
    if(typeof filebuffer === "string" || filebuffer instanceof String)
        filebuffer = fs.readFileSync(filebuffer);
    if(getID3Start(filebuffer) == -1) return false;
    var header = new Buffer(10);
    filebuffer.copy(header, 0, getID3Start(filebuffer))
    var frameSize = getFrameSize(header) + 10;
    var ID3Frame = new Buffer(frameSize + 1);
    filebuffer.copy(ID3Frame, 0, getID3Start(filebuffer));

    var tags = {};
    var frames = Object.keys(TIF);
    var spFrames = Object.keys(SIF);

    for(var i = 0; i < frames.length; i++) {
        var frameStart = ID3Frame.indexOf(TIF[frames[i]]);
        if(frameStart == -1) continue;

        frameSize = parseInt(ID3Frame.slice(frameStart + 4, frameStart + 8).toString('hex'), 16);
        var offset = 1;
        var frame = new Buffer(frameSize - offset);
        ID3Frame.copy(frame, 0, frameStart + 10 + offset);

        var decoded = "";

        if(ID3Frame[frameStart + 10] == 0x01) {
            decoded = iconv.decode(frame, "utf16");
        } else {
            decoded = frame.toString('ascii').replace(/\0/g, "");
        }

        tags[frames[i]] = decoded;
    }

    for(var i = 0; i < spFrames.length; i++) {
        var frame = getFrame(ID3Frame, SIF[spFrames[i]].name);
        if(!frame) continue;
        tags[spFrames[i]] = this[SIF[spFrames[i]].read](frame);
    }

    if(ID3Frame.indexOf("APIC")) {
        var picture = {};
        var APICFrameStart = ID3Frame.indexOf("APIC");
        var APICFrameSize = parseInt(ID3Frame.slice(APICFrameStart + 4, APICFrameStart + 8).toString('hex'), 16);
        var APICFrame = new Buffer(APICFrameSize);
        ID3Frame.copy(APICFrame, 0, APICFrameStart + 10);
        var APICMimeType = APICFrame.toString('ascii').substring(1, APICFrame.indexOf(0x00, 1));
        if(APICMimeType == "image/jpeg") picture.mime = "jpeg";
        else if(APICMimeType == "image/png") picture.mime = "png";
        picture.type = {id: APICFrame[APICFrame.indexOf(0x00, 1) + 1], name: APICTypes[APICFrame[APICFrame.indexOf(0x00, 1) + 1]]}
        var descEnd;
        if(APICFrame[0] == 0x00) {
        	picture.description = APICFrame.slice(APICFrame.indexOf(0x00, 1) + 2, APICFrame.indexOf(0x00, APICFrame.indexOf(0x00, 1) + 2)).toString('ascii') || undefined;
        	descEnd = APICFrame.indexOf(0x00, APICFrame.indexOf(0x00, 1) + 2);
        } else if (APICFrame[0] == 0x01) {
        	var desc = APICFrame.slice(APICFrame.indexOf(0x00, 1) + 2);
        	var descFound = false;

        	for(var i = 0; i < APICFrame.length - 1; i++) {
        		if(descStart[i] == 0x00 && descStart[i + 1] == 0x00) {
        			descFound = i + 1;
        			descEnd = APICFrame.indexOf(APICFrame.indexOf(0x00, 1) + 2 + i + 1);
        			break;
        		}
        	}
        	if(descFound) {
        		picture.description = iconv.decode(desc.slide(0, descFound), 'utf16') || undefined;
        	}
        }
        if(descEnd) {
        	picture.imageBuffer = APICFrame.slice(descEnd + 1);
        } else {
        	picture.imageBuffer = APICFrame.slice(APICFrame.indexOf(0x00, 1) + 2);
        }

        tags.image = picture;
    }

    return tags;
}

function getID3Start(buffer) {
    var ts = String.prototype.indexOf.call(buffer, (new Buffer("ID3")));
    if(ts == -1 || ts > 20) return -1;
    else return ts;
}

function getFrameSize(buffer) {
    return decodeSize(new Buffer([buffer[6], buffer[7], buffer[8], buffer[9]]));
}

function getFrame(buffer, frameName) {
    var frameStart = buffer.indexOf(frameName);
    if(frameStart == -1) return null;
        
    frameSize = decodeSize(new Buffer([buffer[frameStart + 4], buffer[frameStart + 5], buffer[frameStart + 6], buffer[frameStart + 7]]));
    var frame = new Buffer(frameSize);
    buffer.copy(frame, 0, frameStart + 10);
    return frame;
}

function decodeBuffer(buffer, encodingbyte) {
	if(encodingbyte == 0x00) {
		return buffer.toString('ascii');
	} else if(encodingbyte == 0x01) {
		return iconv.decode(buffer, "utf16");
	} else {
		return buffer.toString();
	}
}

NodeID3.prototype.removeTagsFromBuffer = function (data){
  var ts = String.prototype.indexOf.call(data, (new Buffer("ID3")));

  if(ts == -1 || ts > 20) return false;

  var hSize = new Buffer([data[ts +6], data[ts +7], data[ts +8], data[ts +9]]);

  if ((hSize[0] | hSize[1] | hSize[2] | hSize[3]) & 0x80) {
      //INVALID TAG SIZE
      return false;
  }

  var encSize = ((hSize[0] << 21) + (hSize[1] << 14) + (hSize[2] << 7) + (hSize[3]));
  return data.slice(ts + encSize + 10);

};

NodeID3.prototype.removeTags = function(filepath) {
    try {
        var data = fs.readFileSync(filepath);
    } catch(e) {
        return e;
    }

    var newData = this.removeTagsFromBuffer(data);
    if(!newData) return false;

    try {
        fs.writeFileSync(filepath, newData, 'binary');
    } catch(e) {
        return e;
    }

    return true;
}

function encodeSize(totalSize) {
    byte_3 = totalSize & 0x7F;
    byte_2 = (totalSize >> 7) & 0x7F;
    byte_1 = (totalSize >> 14) & 0x7F;
    byte_0 = (totalSize >> 21) & 0x7F;
    return ([byte_0, byte_1, byte_2, byte_3]);
}

function decodeSize(hSize) {
    return ((hSize[0] << 21) + (hSize[1] << 14) + (hSize[2] << 7) + (hSize[3]));
}

NodeID3.prototype.createTagHeader = function() {
    var header = new Buffer(10);
    header.fill(0);
    header.write("ID3", 0);             //File identifier
    header.writeUInt16BE(0x0300, 3);    //Version 2.3.0  --  03 00
    header.writeUInt16BE(0x0000, 5);    //Flags 00
    return header;
}

NodeID3.prototype.createTextFrame = function(specName, text) {
    if(!specName || !text) return null;

    var encoded = iconv.encode(text,"utf16");

    var buffer = new Buffer(10);
    buffer.fill(0);
    buffer.write(specName, 0);
    buffer.writeUInt32BE((encoded).length + 1, 4);     //Size of frame
    var encBuffer = new Buffer(1);                  //Encoding (now using UTF-16 encoded w/ BOM)
    encBuffer.fill(1);

    var contentBuffer = new Buffer(encoded, 'binary'); //Text -> Binary encoding for UTF-16 w/ BOM
    return Buffer.concat([buffer, encBuffer, contentBuffer]);
}

NodeID3.prototype.createPictureFrame = function(filepath) {
    try {
        var apicData = new Buffer(fs.readFileSync(filepath, 'binary'), 'binary');
        var bHeader = new Buffer(10);
        bHeader.fill(0);
        bHeader.write("APIC", 0);

    	var mime_type = "image/png";

        if(apicData[0] == 0xff && apicData[1] == 0xd8 && apicData[2] == 0xff) {
            mime_type = "image/jpeg";
        }

        var bContent = new Buffer(mime_type.length + 4);
        bContent.fill(0);
        bContent[mime_type.length + 2] = 0x03; //front cover for now
        bContent.write(mime_type, 1);

    	bHeader.writeUInt32BE(apicData.length + bContent.length, 4);     //Size of frame

        return Buffer.concat([bHeader, bContent, apicData]);
    } catch(e) {
        return e;
    }
}

NodeID3.prototype.createCommentFrame = function(comment) {
    comment = comment || {};
    if(!comment.text) return null;
    var buffer = new Buffer(10);
    buffer.fill(0);
    buffer.write("COMM", 0);
    var commentOptions = new Buffer(4);
    commentOptions.fill(0);
    commentOptions[0] = 0x01;
    if(comment.language) {
        commentOptions.write(comment.language, 1);
    } else {
        commentOptions.write("eng", 1);
    }
    var commentText = new Buffer(iconv.encode(comment.text, "utf16"));

    comment.shortText = comment.shortText || "";
    var commentShortText = iconv.encode(comment.shortText, "utf16");
    commentShortText = Buffer.concat([commentShortText, (comment.shortText == "") ? new Buffer(2).fill(0) : new Buffer(1).fill(0)]);
    buffer.writeUInt32BE(commentOptions.length + commentShortText.length + commentText.length, 4);     //Size of frame
    return Buffer.concat([buffer, commentOptions, commentShortText, commentText]);
}

NodeID3.prototype.readCommentFrame = function(frame) {
    var tags = {};
    if(!frame) return tags;
    if(frame[0] == 0x00) {
        tags = {
            language: frame.toString().substring(1, 4),
            shortText: frame.toString().substring(4, frame.indexOf(0x00, 1)),
            text: frame.toString().substring(frame.indexOf(0x00, 1) + 1)
        }
    } else if(frame[0] == 0x01) {
        var buf16 = frame.toString('hex');
        var doubleEscape = parseInt(buf16.indexOf("0000") / 2);
        var shortText = new Buffer(doubleEscape - 4 + 1);
        var text = new Buffer(frame.length - doubleEscape - 1);
        frame.copy(shortText, 0, 4, doubleEscape + 1);
        frame.copy(text, 0, doubleEscape + 2);
        tags = {
            language: frame.toString().substring(1, 4),
            shortText: iconv.decode(shortText, "utf16"),
            text: iconv.decode(text, "utf16")
        }
    }

    return tags;
}
