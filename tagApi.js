
var unirest = require("unirest");
var req = unirest("GET", "http://api.imagga.com/v1/tagging");
var fs = require("fs");

function uploadImage(filepath) {
  unirest.post("http://api.imagga.com/v1/content")
          .header({
            //"authorization": "Basic YWNjXzJkYzdkNzNjMmYwODliMToxYzQ3Yzg2ZDg0YjdmYjdjYjZjNzQ1NTQ1MmYwNTgzMQ==",
            "authorization": "Basic YWNjXzM3MGI3MWVkNWE5MzA1ODplNjg3ZmRiMTkzMzBiZmFjMTcyNGRiNjhiMjkyN2IzMA==",
            "accept": "application/json"
          })
          .attach('file', filepath)
          .end(function (response) {
            console.log(response.body);
            /*
             * { status: 'success',
             *   uploaded:
             *      [ { id: 'ae309b386efbcf7fb8d40431d8c470c6',
             *             filename: 'example_photo.jpg' } ] }
             */
            getImageTags(response.body.uploaded[0].id);
          });
}

function getImageTags(contentId) {

  //var fileContent = fs.readFileSync(filepath);

  //console.log(fileContent.toString());

  req.query({
    //"url": "http://playground.imagga.com/static/img/example_photo.jpg",
    "content": contentId,
    "version": "2"
  });

  req.headers({
    //"authorization": "Basic YWNjXzJkYzdkNzNjMmYwODliMToxYzQ3Yzg2ZDg0YjdmYjdjYjZjNzQ1NTQ1MmYwNTgzMQ==",
    "authorization": "Basic YWNjXzM3MGI3MWVkNWE5MzA1ODplNjg3ZmRiMTkzMzBiZmFjMTcyNGRiNjhiMjkyN2IzMA==",
    "accept": "application/json"
  });

  req.end(function (res) {
    if (res.error) throw new Error(res.error);
    console.log(res.body.results[0].tags);
  });

}

//uploadImage("./example_photo.jpg")
uploadImage("/home/atupal/Pictures/black.png")
//getImageTags("ae309b386efbcf7fb8d40431d8c470c6");
