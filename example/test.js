var nodeID3 = require('../index.js');
var fs = require('fs');

//tags.image is the path to the image (only png/jpeg files allowed)
var tags = {
  title: "分島花音 Hajime no Ippo",
  artist: "Luck Life",
  album: "Cheer Danshi!!",
  image: "./example/image.jpeg",
  year: 2016,
  comment: {
    language: "eng",
    shortText: "jadskdjdsd",
    text: "asdasddassd"
  }
}

//var success = nodeID3.write(tags, "./example/musicbig.mp3");	//Pass tags and filepath
//console.log(success);

//No image support atm
var read = nodeID3.read("./example/testimage.mp3");
fs.writeFileSync('./testimage.' + read.image.mime, read.image.imageBuffer);
console.log(read);