var nodeID3 = require('../index.js');

//tags.image is the path to the image (only png/jpeg files allowed)
var tags = {
  title: "Soshite Bokura wa",
  artist: "Ray",
  album: "Nagi no Asukara",
  composer: "Nakazawa Tomoyuki",
  image: "./example/image.jpeg"
}

var success = nodeID3.write(tags, "./example/music.mp3");	//Pass tags and filepath
console.log(success);										//true or contains error