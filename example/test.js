const nodeID3 = require('../index.js')
const fs = require('fs')

/*
//tags.image is the path to the image (only png/jpeg files allowed)
const tags = {
  title: "Tomorrow",
  artist: "Kevin Penkin",
  album: "TVアニメ「メイドインアビス」オリジナルサウンドトラック",
  image: "./example/mia_cover.jpg",
  year: 2017,
  comment: {
    language: "eng",
    text: "some text"
  },
  TRCK: "27"
}

let success = nodeID3.write(tags, "./example/Kevin Penkin - Tomorrow.mp3");
console.log(success);

//async

nodeID3.write(tags, "./example/Kevin Penkin - Tomorrow.mp3", function(err) {
  console.log(err)
})
*/

//console.log(nodeID3.read("./example/Kevin Penkin - Tomorrow.mp3"))

nodeID3.read("./example/Kevin Penkin - Tomorrow.mp3", function(err, tags) {
  console.log(err)
  console.log(tags)
})