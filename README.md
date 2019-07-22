# node-id3

node-id3 is a ID3-Tag library written in JavaScript without other dependencies.

## Installation
```
npm install node-id3
```

## Usage

```javascript
const NodeID3 = require('node-id3')

/* Variables found in the following usage examples */

//  file can be a buffer or string with the path to a file
let file = './path/to/(mp3)file' || new Buffer("Some Buffer of a (mp3) file")
let filebuffer = new Buffer("Some Buffer of a (mp3) file")
let filepath = './path/to/(mp3)file'
```

### Creating/Writing tags

```javascript
//  Define the tags for your file using the ID (e.g. APIC) or the alias (see at bottom)
let tags = {
  title: "Tomorrow",
  artist: "Kevin Penkin",
  album: "TVアニメ「メイドインアビス」オリジナルサウンドトラック",
  APIC: "./example/mia_cover.jpg",
  TRCK: "27"
}

//  Create a ID3-Frame buffer from passed tags
//  Synchronous
let ID3FrameBuffer = NodeID3.create(tags)   //  Returns ID3-Frame buffer
//  Asynchronous
NodeID3.create(tags, function(frame) {  })

//  Write ID3-Frame into (.mp3) file
let success = NodeID3.write(tags, file) //  Returns true/false or, if buffer passed as file, the tagged buffer
NodeID3.write(tags, file, function(err, buffer) {  }) //  Buffer is only returned if a buffer was passed as file

//  Update existing ID3-Frame with new/edited tags
let success = NodeID3.update(tags, file) //  Returns true/false or, if buffer passed as file, the tagged buffer
NodeID3.update(tags, file, function(err, buffer) {  })  //  Buffer is only returned if a buffer was passed as file
```

### Reading ID3-Tags

```javascript
let tags = NodeID3.read(file)
NodeID3.read(file, function(err, tags) {
  /*
  tags: {
    title: "Tomorrow",
    artist: "Kevin Penkin",
    image: {
      mime: "jpeg",
      type: {
        id: 3,
        name: "front cover"
      },
      description: String,
      imageBuffer: Buffer
    },
    raw: {
      TIT2: "Tomorrow",
      TPE1: "Kevin Penkin",
      APIC: Object (See above)
    }
  }
  */
})
```

### Removing ID3-Tags from file/buffer

```javascript
let success = NodeID3.removeTags(filepath)  //  returns true/false
NodeID3.removeTags(filepath, function(err) {  })

let bufferWithoutID3Frame = NodeID3.removeTagsFromBuffer(filebuffer)  //  Returns Buffer
```

## Supported aliases
```
album:
bpm:
composer:
genre:
copyright:
date:
playlistDelay:
encodedBy:
textWriter:
fileType:
time:
contentGroup:
title:
subtitle:
initialKey:
language:
length:
mediaType:
originalTitle:
originalFilename:
originalTextwriter:
originalArtist:
originalYear:
fileOwner:
artist:
performerInfo:
conductor:
remixArtist:
partOfSet:
publisher:
trackNumber:
recordingDates:
internetRadioName:
internetRadioOwner:
size:
ISRC:
encodingTechnology:
year:
comment: {
  language: "eng",
  text: "mycomment"
}
unsynchronisedLyrics: {
  language: "eng",
  text: "lyrics"
}
userDefinedText: [{
  description: "txxx name",
  value: "TXXX value text"
}, {
  description: "txxx name 2",
  value: "TXXX value text 2"
}] // Care, update doesn't delete non-passed array items!
image: {
  mime: "png/jpeg"/undefined,
  type: {
    id: 3,
    name: "front cover
  }, // See https://en.wikipedia.org/wiki/ID3#ID3v2_embedded_image_extension
  description: "image description",
  imageBuffer: (file buffer)
}
```

### Supported raw IDs
You can also use the currently supported raw tags like TALB instead of album etc.
```
album:                "TALB"
bpm:                  "TBPM"
composer:             "TCOM"
genre:                "TCON"
copyright:            "TCOP"
date:                 "TDAT"
playlistDelay:        "TDLY"
encodedBy:            "TENC"
textWriter:           "TEXT"
fileType:             "TFLT"
time:                 "TIME"
contentGroup:         "TIT1"
title:                "TIT2"
subtitle:             "TIT3"
initialKey:           "TKEY"
language:             "TLAN"
length:               "TLEN"
mediaType:            "TMED"
originalTitle:        "TOAL"
originalFilename:     "TOFN"
originalTextwriter:   "TOLY"
originalArtist:       "TOPE"
originalYear:         "TORY"
fileOwner:            "TOWN"
artist:               "TPE1"
performerInfo:        "TPE2"
conductor:            "TPE3"
remixArtist:          "TPE4"
partOfSet:            "TPOS"
publisher:            "TPUB"
trackNumber:          "TRCK"
recordingDates:       "TRDA"
internetRadioName:    "TRSN"
internetRadioOwner:   "TRSO"
size:                 "TSIZ"
ISRC:                 "TSRC"
encodingTechnology:   "TSSE"
year:                 "TYER"
comment:              "COMM"
image:                "APIC"
unsynchronisedLyrics  "USLT"
userDefinedText       "TXXX"
```