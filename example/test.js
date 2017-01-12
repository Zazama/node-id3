var nodeID3 = require('../index.js');

//tags.image is the path to the image (only png/jpeg files allowed)
var tags = {
  title: "分島花音 Hajime no Ippo",
  artist: "Luck Life",
  album: "Cheer Danshi!!",
  image: "./example/image.jpeg",
  year: 2016
}

var success = nodeID3.write(tags, "./example/musicbig.mp3");	//Pass tags and filepath
console.log(success);

//No image support atm
var read = nodeID3.read("./example/musicbig.mp3");
console.log(read);