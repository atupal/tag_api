var mongodb = require('mongodb');
var assert = require('assert');
var fs = require('fs');
var mongoClient = mongodb.MongoClient;
var connURL = 'mongodb://localhost/ImageStory';
var imageFolder = './images/'
function insertStory(db, data, callback) {
    db.collection('stories').insert(data, function (err, res) {
        if (err == null) {
            console.log('insert story success.');
        } else {
            console.error(err);
        }
        callback();
    });	
}

function importImages() {
	var f = fs.readdirSync(imageFolder);
	var stories = [];
	debugger;
	for (var s in f) {
		if (fs.lstatSync(imageFolder + f[s]).isDirectory() == false) {
			continue;
		}
		var i = fs.readdirSync(imageFolder + f[s]);

		var images = [];
		for (var j in i) {
			var image = {};
			var content = fs.readFileSync(imageFolder + f[s] + '/' + i[j]);
			fs.writeFileSync(imageFolder + f[s] + '' + j + '.jpg', content);
			image['url'] = f[s] + '' + j + '.jpg';
			image['comment'] = ''
			image['tags'] = [];
			image['face'] = [];
			images.push(image);
		}
		var story = {};
		story['title'] = s;
		story['content'] = '';
		story['authorName'] = '';
		story['PostDate'] = '2015.07.28';
		story['images'] = images;
		stories.push(story);
	}
	
	mongoClient.connect(connURL, function(err, db) {
		assert.equal(null, err);
		insertStory(db, stories, function() {
			db.close();
		});
	});
}

importImages()