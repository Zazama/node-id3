# node-id3

node-id3 is a ID3-Tag library written in JavaScript without other dependencies.

#### Right now, there's only write, remove and partial read support (only ID3v2)

#### Please update to +v0.0.6 for better image tagging.

## Example:

```
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

###Write ID3v2-Tags
```
//Pass tags and filepath
var success = nodeID3.write(tags, "./example/music.mp3");
//returns true if written correctly
console.log(success);
```

###Read ID3v2-Tags (currently no support for images)
```
//Pass filepath/buffer
var read = nodeID3.read("./example/music.mp3");
//returns tags
console.log(read);
```

###Remove ID3v2-Tags
```
nodeID3.removeTags("./example/music.mp3");  //Pass the path to the mp3 file
```

###Supported tag keys
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
```