var nodeID3 = require('../index.js');
var fs = require('fs');

//tags.image is the path to the image (only png/jpeg files allowed)
var tags = {
  title: "Restoring the Light, Facing the Dark",
  artist: "Gareth Coker",
  album: "Ori and the Blind Forest (Original Soundtrack)",
  image: "./example/oriscreen.jpg",
  year: 2015,
  /*comment: {
    language: "eng",
    shortText: "best",
    text: "game of the year"
  },*/ // comment tag still broken
  TRCK: "17"  //trackNumber 17 set with its raw tag
}

console.log(tags);

var success = nodeID3.write(tags, "./example/17. Restoring the Light, Facing the Dark.mp3");	//Pass tags and filepath
console.log(success);

No image support atm
var read = nodeID3.read("./example/17. Restoring the Light, Facing the Dark.mp3", {rawTags: true});
console.log(read);