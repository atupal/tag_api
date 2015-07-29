var express = require('express');
var mongodb = require('mongodb');
var fsSync = require('fs-sync');
var fs = require('fs');
var multipart = require('connect-multiparty');

var tagApi = require('./tagApi.js')

var mongoClient = mongodb.MongoClient;
var app = express();
var multipartMiddleware = multipart();
var connURL = 'mongodb://localhost/ImageStory';
var storyCollection = 'stories';
var imageLocation = 'images/';

// configure public folder to store images
app.use(express.static(imageLocation));

app.post('/api/story/process', multipartMiddleware, function(req, res) {
    var images = [];
    for (var key in req.files) {
        var hashName = req.files[key].path.split("\\").slice(-1)[0] + '.jpg';
        var content = fs.readFileSync(req.files[key].path);
        fs.writeFileSync('./images/' + hashName, content);
        images.push('./images/' + hashName);
    }

    tagApi.uploadImage(images, function(results) {
        var image = {};
        for (var key in results) {
            var tags = results[key].tags;
            var faces = results[key].faces;
            var comment = generateComment(tags, faces);
            image['tags'] =  tags;
            image['faces'] = faces;
            image['comment'] = comment;
        }

        res.format({
            'application/json': function() {
            res.send(image);
        }});  
    });
});

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
    var images = [];
    var comments = req.body.comments;
    var idx = 0;  

    for (var key in req.files) {
        var hashName = req.files[key].path.split("\\").slice(-1)[0] + '.jpg';
        var content = fs.readFileSync(req.files[key].path);
        fs.writeFileSync('./images/' + hashName, content);

        var image = {};
        image['url'] = hashName;
        image['comment'] = comments[idx++];
        images.push(image);
    }

    var story = {};
    story['title']       = req.body.title;
    story['content']     = req.body.content;
    story['authorName']  = req.body.authorName;
    story['PostDate']    = req.body.postDate;
    story['images']      = images;

    mongoClient.connect(connURL, function(err, db) {
        if (err == null) {
            insertStory(db, story, function() {
                db.close();
            })
        } else {
            log.error(err);
        }

        console.log('disconnected from server.')
    });

    res.format({
        'application/json': function() {
        res.send({'message' : 'done'});
    }});
});

app.get('/', function(req, res) {
    res.writeHead(200, { 'Content-Type': 'text/html' });
    var form = '<form action="/api/story/process" enctype="multipart/form-data" method="post">Add a title: <input name="title" type="text" /><br><br><input multiple="multiple" name="upload" type="file" /><br><br><input type="submit" value="Upload" /></form>';
    res.end(form);
});

app.listen(8888);

function insertStory(db, data, callback) {
    db.collection(storyCollection).insert(data, function (err, res) {
        if (err == null) {
            console.log('insert story success.');
        } else {
            console.error(err);
        }
        callback();
    });
}

function queryStory(db, callback) {
    var stories = [];
    var cursor = db.collection(storyCollection).find();
    cursor.sort({_id : -1});
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

function generateComment(tags, faces)
{
    var comment = '';

    var person = 'He';
    var verb = ' looks';
    var copula = ' is';
debugger;
    if (faces.length > 1) { 
        person = 'They';
        verb = ' look';
        copula = ' are';
    } else {
        person = getGender(faces) == 'male'?'He':'She';
    }

    if(tagsContainTag(tags,"child") || tagsContainTag(tags,"baby") || tagsContainTag(tags,"little")){
        comment += verb + ' at this little one,';
    }

    if((tagsContainTag(tags,"man") || tagsContainTag(tags,"woman")) && tagsContainTag(tags,"adult") ){
        comment += verb + ' at this adult,';
    }

    if(tagsContainTag(tags,"cute")){
        comment += person + verb + ' very cute ,';
    }

    if(tagsContainTag(tags,"relax")){
        comment +=  person + copula + ' enjoying relax now,';
    }

    if(tagsContainTag(tags,'smile')){
        comment +=  person + copula + ' smiling now ,';
    }

    if(tagsContainTag(tags,'home')){
        comment +=  person + copula + ' at home ,';
    }

    if(tagsContainTag(tags,'bath') || tagsContainTag(tags,'bathtub') || tagsContainTag(tags,'toilet')){
        comment +=  person + copula + ' doing a bath; Haha …';
    }

    return comment;
}

function tagsContainTag(tags,tag){
    for(var i=0;i< tags.length;i++){
        if(tags[i]==tag)return true;
    }
    return false;
}

function getGender(faces){
    if(faces.gender == 'Male')return 'male';
    return 'female';
}