var fs = require('fs');

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

    var size = this.encodeSize(totalSize);

    frames[0].writeUInt8(size[0], 6);
    frames[0].writeUInt8(size[1], 7);
    frames[0].writeUInt8(size[2], 8);
    frames[0].writeUInt8(size[3], 9);

    var completeTag = Buffer.concat(frames);

    this.removeTags(filepath);

    try {
        var data = fs.readFileSync(filepath);
        var rewriteFile = Buffer.concat([completeTag, data]);
        fs.writeFileSync(filepath, rewriteFile, 'binary');
    } catch(e) {
        return e;
    }

    return true;
}

NodeID3.prototype.removeTags = function(filepath) {
    try {
        var data = fs.readFileSync(filepath);
    } catch(e) {
        return e;
    }

    var tagStart = String.prototype.indexOf.call(data, (new Buffer("ID3")))

    if(tagStart == -1 || tagStart > 20) return true;    //No Tags found || TEMP FIX (TODO)

    var hSize = new Buffer([data[tagStart + 6], data[tagStart + 7], data[tagStart + 8], data[tagStart + 9]]);

    if ((hSize[0] | hSize[1] | hSize[2] | hSize[3]) & 0x80) {
        //INVALID TAG SIZE
        return false;
    }

    var encSize = ((hSize[0] << 21) + (hSize[1] << 14) + (hSize[2] << 7) + (hSize[3]));

    var newData = data.slice(tagStart + encSize + 10);

    try {
        fs.writeFileSync(filepath, newData, 'binary');
    } catch(e) {
        return e;
    }

    return true;
}

NodeID3.prototype.encodeSize = function(totalSize) {
    byte_3 = totalSize & 0x7F;
    byte_2 = (totalSize >> 7) & 0x7F;
    byte_1 = (totalSize >> 14) & 0x7F;
    byte_0 = (totalSize >> 21) & 0x7F;
    return ([byte_0, byte_1, byte_2, byte_3]);
}

NodeID3.prototype.decodeSize = function(totalSize) {

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

    var buffer = new Buffer(10);
    buffer.fill(0);
    buffer.write(specName, 0);
    buffer.writeUInt32BE((text).length + 1, 4);     //Size of frame
    var encBuffer = new Buffer(1);                  //Encoding (currently only ISO - 00)
    encBuffer.fill(0);

    var contentBuffer = new Buffer(text, 'binary'); //Text -> Binary encoding for ISO
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
        bContent.write(mime_type, 1);

    	bHeader.writeUInt32BE(apicData.length + bContent.length, 4);     //Size of frame

        return Buffer.concat([bHeader, bContent, apicData]);
    } catch(e) {
        return e;
    }
}
