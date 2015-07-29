
var unirest = require("unirest");
var fs = require("fs");
var _ = require("underscore");

function uploadImage(filepaths, callback) {

  var headers = {
    //"authorization": "Basic YWNjXzJkYzdkNzNjMmYwODliMToxYzQ3Yzg2ZDg0YjdmYjdjYjZjNzQ1NTQ1MmYwNTgzMQ==",
    "authorization": "Basic YWNjXzM3MGI3MWVkNWE5MzA1ODplNjg3ZmRiMTkzMzBiZmFjMTcyNGRiNjhiMjkyN2IzMA==",
    "accept": "application/json"
  }

  var results = {};
  var finished = _.after(filepaths.length+1, function() {
    console.log(results);
    callback(results);
  });

  var req = unirest.post("http://api.imagga.com/v1/content").header(headers);
  for (var idx in filepaths) {
    req.attach('file'+idx, filepaths[idx]);
    var filepath = filepaths[idx];
    results[filepath.split('/').slice(-1)] = {};
    analyzeImage(filepath, function(filepath, faces) {
      results[filepath.split('/').slice(-1)].faces = faces ? faces : [];
      finished();
    });
  }

  req.end(function (response) {

    //console.log(response.body);

    /*
     * { status: 'success',
     *   uploaded:
     *      [ { id: 'ae309b386efbcf7fb8d40431d8c470c6',
     *             filename: 'example_photo.jpg' } ] }
     */

    var ids = {};
    for (var idx in response.body.uploaded) {
      ids[response.body.uploaded[idx].id] = response.body.uploaded[idx].filename;
    }

    var req = unirest("GET", "http://api.imagga.com/v1/tagging").header(headers);
    req.query({
      "version": "2"
    });

    for (var id in ids) {
      req.query({
        "content": id
      })
    }
debugger;
    req.end(function(response) {
      console.log(response.body);
      debugger;
      for (var idx in response.body.results) {
        var tagsDict = response.body.results[idx].tags;
        var tags = [];
        var cnt = 0;
        for (var i in tagsDict) {
          tags.push(tagsDict[i].tag);
          cnt += 1;
          if (cnt >= 10) break;
        }

        results[ ids[response.body.results[idx].image] ].tags = tags;
      }

      //callback(results);
      finished();
    });

  });

}

function getImageTags(contentId) {
  var req = unirest("GET", "http://api.imagga.com/v1/tagging");

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


function analyzeImage(filepath, callback) {
  unirest.post("https://api.projectoxford.ai/vision/v1/analyses?visualFeatures=Faces")
  //unirest.post("https://api.projectoxford.ai/vision/v1/analyses?visualFeatures=All")
    .header({
      "Content-Type": "multipart/form-data",
      "Ocp-Apim-Subscription-Key": "38762bee7d8440ae91409f5ee5a1f396",
    })
    .attach('file', filepath)
    .end(function(response){
      callback(filepath, response.body.faces);
    });
}

module.exports.uploadImage = uploadImage;
//uploadImage(["./images/1GpO4Mw_K8kjdh-JtM8EkFkE.jpg.jpg", "./black.png", "fbb.jpg"], console.log);
//uploadImage(["./example_photo.jpg", "./black.png"], function(results){});
//analyzeImage("./fbb.jpg", console.log);
//analyzeImage("./example_photo.jpg", console.log);
