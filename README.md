# node-id3

node-id3 is a ID3-Tag library written in JavaScript without other dependencies.

#### Right now, there's only write and remove support (No read, only ID3v2)

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

var success = nodeID3.write(tags, "./example/music.mp3");  	//Pass tags and filepath
console.log(success);										//true or contains error
```

###Remove ID3v2-Tags
```
nodeID3.removeTags("./music.mp3");  //Pass the path to the mp3 file
```

###Supported tag keys (only pass strings)
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
```