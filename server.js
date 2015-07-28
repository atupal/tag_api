var express = require('express');
var mongodb = require('mongodb');
var fs = require('fs-extra');
var multipart = require('connect-multiparty');

//var tagApi = require('./tagApi.js')

var mongoClient = mongodb.MongoClient;
var app = express();
var multipartMiddleware = multipart();
var connURL = 'mongodb://localhost/ImageStory';
var storyCollection = 'stories';
var imageLocation = 'images/';

// configure public folder to store images
app.use('/images', express.static(imageLocation));

// handle get story list request GET
app.get('/api/story/list', function(req, res) {
    mongoClient.connect(connURL, function(err, db) {
        if (err == null) {
            queryStory(db, function(stories) {
                db.close();
                if (typeof stories === 'string' && stories == 'error') {
                    res.format({
                        'application/json': function() {
                        res.send(stories);
                    }});                    
                } else {
                    res.format({
                        'application/json': function() {
                        res.send(stories);
                    }});                    
                }
            });
        } else {
            console.error(err);
        }
    });
});

// handle save story request POST
app.post('/api/story/save', multipartMiddleware, function(req, res) {

    console.log(req.body);
    //console.log(req);
    //console.log(req.files);

    var comments = req.body.comments;
    var idx = 0;
    var images = [];
    for (var key in req.files) {
        var hashName = req.files[key].path.split("\\").slice(-1)[0] + '.jpg';

        var image = {}
        image['url'] = imageLocation + hashName;
        image['comments'] = comments[idx++];
        image['tags'] = ['cloud'];
        image['face'] = ['smile'];

        images.push(image);

        fs.copy(req.files[key].path, imageLocation + hashName, function(err) {
            if (err == null) {
                console.log("Save file " + " success.");
            } else {
                console.error("");
            }
        });

        //uploadImage('./' + imageLocation + hashName);
    }

    var story = {};
    story['title']   = req.body.title;
    story['content'] = req.body.content;
    story['authorName']  = req.body.authorName;
    story['PostDate']    = req.body.postDate;
    story['images']  = images;
    mongoClient.connect(connURL, function(err, db) {
        if (err == null) {
            insertStory(db, story, function(result) {
                db.close();
            })
        } else {
            log.error(err);
        }

        console.log('Disconnected from server.')
    });

    res.format({
        'application/json': function() {
        res.send({'message' : 'done'});
    }});
});

app.get('/', function(req, res) {
    res.writeHead(200, { 'Content-Type': 'text/html' });
    var form = '<form action="/api/story/save" enctype="multipart/form-data" method="post">Add a title: <input name="title" type="text" /><br><br><input multiple="multiple" name="upload" type="file" /><br><br><input multiple="multiple" name="upload2" type="file" /><br><br><input type="submit" value="Upload" /></form>';
    res.end(form);
});

app.listen(8888);

function insertStory(db, data, callback) {
    db.collection(storyCollection).insert(data, function (err, res) {
        if (err == null) {
            console.log('Insert story success.');
        } else {
            console.error(err);
        }
        callback(res);
    });
}

function queryStory(db, callback) {
    var stories = [];
    var cursor = db.collection(storyCollection).find();
    
    cursor.each(function(err, doc) {
        if (err == null) {
            if (doc != null) {
                stories.push(doc);
            } else {
                callback(stories);
            }
        } else {
            console.error(err);
        }
    });    
}