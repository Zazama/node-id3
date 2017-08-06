# node-id3

node-id3 is a ID3-Tag library written in JavaScript without other dependencies.

#### Right now, there's only write, remove and read support (only ID3v2)

## Example:

```javascript
var nodeID3 = require('node-id3');

//tags.image is the path to the image (only png/jpeg files allowed)
var tags = {
  title: "Soshite Bokura wa",
  artist: "Ray",
  album: "Nagi no Asukara",
  composer: "Nakazawa Tomoyuki",
  image: "./example/image.jpeg"
}

nodeID3.removeTags("./example/music.mp3")

//Pass tags and filepath
var success = nodeID3.write(tags, "./example/music.mp3");

//returns true if written correctly
console.log(success);

//Pass filepath/buffer
var read = nodeID3.read("./example/music.mp3");

//returns tags
console.log(read);
```

### Write ID3v2-Tags
```javascript
//Pass tags and filepath
var success = nodeID3.write(tags, "./example/music.mp3");
//returns true if written correctly
console.log(success);
```

### Read ID3v2-Tags (currently no support for images)
```javascript
//Pass filepath/buffer
var read = nodeID3.read("./example/music.mp3");
//returns tags
console.log(read);
```

### Read raw tags
```javascript
var read = nodeID3.read("./example/music.mp3", {rawTags: true});
//returns tags
console.log(read.raw["APIC"]); // returns image buffer
console.log(read.raw["TALB"]); // returns album
```

### Remove ID3v2-Tags
```javascript
nodeID3.removeTags("./example/music.mp3");  //Pass the path to the mp3 file
```

### Supported tag keys
```
image:
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
comment: { language: "eng", text: "mycomment"}
image: { 
	mime: "png/jpeg"/undefined, 
	type: { id: 3, name: "front cover"}, //See https://en.wikipedia.org/wiki/ID3#ID3v2_embedded_image_extension
	description: "image description", 
	imageBuffer: (file buffer)
}
```

### using raw tags
You can also use the currently supported raw tags like TALB instead of album etc.
```
album:              "TALB"
bpm:                "TBPM"
composer:           "TCOM"
genre:              "TCON"
copyright:          "TCOP"
date:               "TDAT"
playlistDelay:      "TDLY"
encodedBy:          "TENC"
textWriter:         "TEXT"
fileType:           "TFLT"
time:               "TIME"
contentGroup:       "TIT1"
title:              "TIT2"
subtitle:           "TIT3"
initialKey:         "TKEY"
language:           "TLAN"
length:             "TLEN"
mediaType:          "TMED"
originalTitle:      "TOAL"
originalFilename:   "TOFN"
originalTextwriter: "TOLY"
originalArtist:     "TOPE"
originalYear:       "TORY"
fileOwner:          "TOWN"
artist:             "TPE1"
performerInfo:      "TPE2"
conductor:          "TPE3"
remixArtist:        "TPE4"
partOfSet:          "TPOS"
publisher:          "TPUB"
trackNumber:        "TRCK"
recordingDates:     "TRDA"
internetRadioName:  "TRSN"
internetRadioOwner: "TRSO"
size:               "TSIZ"
ISRC:               "TSRC"
encodingTechnology: "TSSE"
year:               "TYER"
```