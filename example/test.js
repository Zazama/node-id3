var id3v2Writer = require('../index');

var tags = {
	title: "Soshite Bokura wa",
	artist: "Ray",
	album: "Nagi no Asukara",
	composer: "Nakazawa Tomoyuki",
	image: "./image.jpeg"
}

id3v2Writer.setTags(tags);
var success = id3v2Writer.write("./music.mp3");
if(success === true) {
	console.log("MP3 File successfully tagged"):
} else {
	console.log("There was an error");
	console.log(success);
}
