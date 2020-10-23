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

const filebuffer = new Buffer("Some Buffer of a (mp3) file")
const filepath = './path/to/(mp3)file'

const tags = {
    title: "Tomorrow",
    artist: "Kevin Penkin",
    album: "TVアニメ「メイドインアビス」オリジナルサウンドトラック",
    APIC: "./example/mia_cover.jpg",
    TRCK: "27"
}
```

### Write tags to file
```javascript
const success = NodeID3.write(tags, filepath) // Returns true/Error
// async version
NodeID3.write(tags, file, function(err) {  })
```

### Write tags to filebuffer
```javascript
const success = NodeID3.write(tags, filebuffer) // Returns Buffer
// async version
NodeID3.write(tags, file, function(err, buffer) {  })
```

### Update existing tags of file or buffer
This will write new/changed values but keep all others
```javascript
const success = NodeID3.update(tags, filepath) //  Returns true/Error
const success = NodeID3.update(tags, filebuffer) //  Returns Buffer
NodeID3.update(tags, filepath, function(err, buffer) {  })
NodeID3.update(tags, filebuffer, function(err, buffer) {  })
```

### Create tags as buffer
```javascript
const success = NodeID3.create(tags) // Returns ID3-Tag Buffer
// async version
NodeID3.create(tags, function(buffer) {  })
```

### Reading ID3-Tags

```javascript
const tags = NodeID3.read(file)
NodeID3.read(file, function(err, tags) {})
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
```

### Removing ID3-Tags from file/buffer

```javascript
const success = NodeID3.removeTags(filepath)  //  returns true/Error
NodeID3.removeTags(filepath, function(err) {  })

let bufferWithoutID3Frame = NodeID3.removeTagsFromBuffer(filebuffer)  //  Returns Buffer
```

## Supported aliases/fields
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
},
popularimeter: {
  email: "mail@example.com",
  rating: 192,  // 1-255
  counter: 12
},
private: [{
  ownerIdentifier: "AbC",
  data: "asdoahwdiohawdaw"
}, {
  ownerIdentifier: "AbCSSS",
  data: Buffer.from([0x01, 0x02, 0x05])
}],
chapter: [{
  elementID: "Hey!", // THIS MUST BE UNIQUE!
  startTimeMs: 5000,
  endTimeMs: 8000,
  startOffsetBytes: 123, // OPTIONAL!
  endOffsetBytes: 456,   // OPTIONAL!
  tags: {                // OPTIONAL
    title: "abcdef",
    artist: "akshdas"
  }
}],
tableOfContents: [{
  elementID: "toc1",    // THIS MUST BE UNIQUE!
  isOrdered: false,     // OPTIONAL, tells a player etc. if elements are in a specific order
  elements: ['chap1'],  // OPTIONAL but most likely needed, contains the chapter/tableOfContents elementIDs
  tags: {               // OPTIONAL
    title: "abcdef"
  }  
}],
commercialUrl: ["commercialurl.com"], // array or single string
copyrightUrl: "example.com",
fileUrl: "example.com",
artistUrl: ["example.com"], // array or single string
audioSourceUrl: "example.com",
radioStationUrl: "example.com",
paymentUrl: "example.com",
publisherUrl: "example.com",
userDefinedUrl: [{
  description: "URL description"
  url: "https://example.com/"
}] // array or single object
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
popularimeter         "POPM"
private               "PRIV"
chapter               "CHAP"
tableOfContents       "CTOC"
commercialUrl         "WCOM"
copyrightUrl          "WCOP"
fileUrl               "WOAF"
artistUrl             "WOAR"
audioSourceUrl        "WOAS"
radioStationUrl       "WORS"
paymentUrl            "WPAY"
publisherUrl          "WPUB"
userDefinedUrl        "WXXX"
```
