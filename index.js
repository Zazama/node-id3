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
    var header = new Buffer(10);
    filebuffer.copy(header, 0, getID3Start(filebuffer))
    frameSize = getFrameSize(header);
    var ID3Frame = new Buffer(frameSize + 1);
    filebuffer.copy(ID3Frame, 0, getID3Start(filebuffer));

    var tags = TIF;
    var frames = Object.keys(tags);
    for(var i = 0; i < frames.length; i++) {
        var frameStart = ID3Frame.indexOf(tags[frames[i]]);
        if(frameStart > -1) {
            var frameSize = decodeSize(new Buffer([ID3Frame[frameStart + 4], ID3Frame[frameStart + 5], ID3Frame[frameStart + 6], ID3Frame[frameStart + 7]]));
            var offset = 1;
            if(ID3Frame[frameStart + 11] == 0xFF || ID3Frame[frameStart + 12] == 0xFE) {
                offset = 3;
            }
            var frame = new Buffer(frameSize - offset);
            ID3Frame.copy(frame, 0, frameStart + 10 + offset);

            tags[frames[i]] = frame.toString('utf8').replace(/\0/g, "");
        } else {
            delete tags[frames[i]];
        }
    }

    /*if(ID3Frame.indexOf("APIC")) {
        var picture = {};
        var APICFrameStart = ID3Frame.indexOf("APIC");
        var APICFrameSize = decodeSize(new Buffer([ID3Frame[APICFrameStart + 4], ID3Frame[APICFrameStart + 5], ID3Frame[APICFrameStart + 6], ID3Frame[APICFrameStart + 7]]));
        var APICFrame = new Buffer(APICFrameSize);
        ID3Frame.copy(APICFrame, 0, frameStart + 10);
        if(APICFrame.indexOf("image/jpeg")) picture.mime = "jpeg";
        else if(APICFrame.indexOf("image/png")) picture.mime = "png";
    }*/

    return tags;
}

function getID3Start(buffer) {
    var tagStart = buffer.indexOf("ID3");
    var musicStart = buffer.indexOf("" + 0xFFFB30);
    if(tagStart > musicStart)
        return tagStart;
    else
        return -1;
}

function getFrameSize(buffer) {
    return decodeSize(new Buffer([buffer[6], buffer[7], buffer[8], buffer[9]]));
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
