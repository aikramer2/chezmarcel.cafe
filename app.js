//https://zellwk.com/blog/crud-express-mongodb/
//https://support.apple.com/en-us/HT201583
//http://photoswipe.com/documentation/getting-started.html

const express = require("express")
const path    = require("path")
const hljs    = require('highlight.js');
const MongoClient = require('mongodb').MongoClient
const bodyParser= require('body-parser')
const fs = require('fs');
const request = require('request');
const AWS = require('aws-sdk');
const s3 = new AWS.S3();
const s3_prefix = "https://s3-us-west-1.amazonaws.com/my-data-repo/photos/all-photos/"
const s3_prefix_thumbs = "https://s3-us-west-1.amazonaws.com/my-data-repo/photos/all-photos/thumbs/"

// Init App
const app = express()

// Load View Engine
app.set('views', path.join(__dirname, 'views'))
app.set('view engine', 'ejs'); // pug
app.use('/static', express.static(path.join(__dirname, 'public')));

// Server Config
var port = process.env.PORT || 8889;
var mongo_uri = process.env.db_url || 'mongodb://localhost/personal'

// Connect to db then listen
let db_promise = MongoClient.connect(mongo_uri)
  .then(function(db){
    app.listen(port, () => {
      db_promise.ready = true
      db_promise.db = db

      console.log('Server listening on '+port)
      console.log('Mongo is available: ' + db_promise.ready)
    })
  })

function build_member_light_gallery_entry(photo_entry){
  if (photo_entry["type"]==="image") {
    return {
      "src": s3_prefix + photo_entry["image_id"],
      "thumb": s3_prefix_thumbs + photo_entry["image_id"],
      // "subHtml": "<input type='text' value='"+photo_entry["caption"]+"'/>"
      // "subHtml": photo_entry["caption"]
      "subHtml": '<div class="fb-comments" data-href="https://developers.facebook.com/docs/plugins/comments#configurator" data-numposts="5"></div>'
    }
    } else {
      return {
        "thumb": "static/img/video-play.png",
        // "html": '<video class="lg-video-object lg-html5" controls preload="none"><source src="'+s3_prefix + photo_entry["image_id"]+'" type="video/mp4">Your browser does not support HTML5 video</video>',
        "html": '<video class="lg-video-object lg-html5" controls preload="none"><source src="'+s3_prefix + photo_entry["image_id"]+'" type="video/mp4">Your browser does not support HTML5 video</video>',
        "subHtml": photo_entry["caption"]}
      }
    }

prep_member = function(member){
  member['lg_entry'] = build_member_light_gallery_entry(member)
  return member
}

// dev attempt
app.get("/albums", function(request, response){
  const photo_collection = db_promise.db.collection("photos")
  const section_collection = db_promise.db.collection("sections")
  let section_promise = new Promise(function(resolve, reject){
    section_collection.find({}).toArray(function(err, data){
      resolve(data)
    })
  })
  section_promise.then(function(sections){
    // each section is {name: '', cover_photo: ''}

    let album_sections = sections.map(function(section){
      let album_members_promise = get_album_members_promise(section["name"])
      let record = album_members_promise.then(function(members){
        return {
          "section": section["name"],
          "img_src": section["cover_photo"],
          "members": members.map(prep_member)
        }
      })
      return record
    })
    //album_sections.map((elem)=>{console.log(typeof(elem))})
    Promise.all(album_sections).then(function(data){
       response.render('empty-dynamic-light-gallery', {photos: data})
     })

  })
})

get_album_members_promise = function(section){
  let query = {
    "album": {
      "$in": [section]
      }
  }
  const photo_collection = db_promise.db.collection("photos")
  const section_collection = db_promise.db.collection("sections")
  let section_members_promise = new Promise(function(resolve, reject){
    photo_collection.find(query).toArray(function(err, data){
      resolve(data)
    })
  })
  return section_members_promise
}

app.get("/population_section/:section", function(request, response){
  let section = request.params.section
  get_album_members_promise(section).then(console.log)
})


//pipe video obj to response
app.get("/video/:file", function(req, res, next){

  let vid_name = req.params.file
  let params = {Bucket: 'my-data-repo', Key: 'photos/all-photos/'+vid_name}
  request(s3_prefix + vid_name).pipe(res)
  })


app.get('/', function(request, response){
  const photo_collection = db_promise.db.collection("photos")
  const section_collection = db_promise.db.collection("sections")
  let section_promise = new Promise(function(resolve, reject){
    section_collection.find({}).toArray(function(err, data){
      resolve(data)
    })
  })
  section_promise.then(function(sections){
    // each section is {name: '', cover_photo: ''}

    let album_sections = sections.map(function(section){
      let album_members_promise = get_album_members_promise(section["name"])
      let record = album_members_promise.then(function(members){
        return {
          "section": section["name"],
          "img_src": section["cover_photo"],
          "members": members.map(prep_member)
        }
      })
      return record
    })
    //album_sections.map((elem)=>{console.log(typeof(elem))})
    Promise.all(album_sections).then(function(data){
       //response.render('albums-version-3', {photos: data})
       response.render('albums-with-previews', {photos: data})
     })

  })
})
