//https://zellwk.com/blog/crud-express-mongodb/
//https://support.apple.com/en-us/HT201583
//http://photoswipe.com/documentation/getting-started.html

const express = require("express")
const path    = require("path")
const hljs    = require('highlight.js');
const MongoClient = require('mongodb').MongoClient
const bodyParser= require('body-parser')
const fs = require('fs');

// Init App
const app = express()

// Load View Engine
app.set('views', path.join(__dirname, 'views'))
app.set('view engine', 'ejs'); // pug
app.use('/static', express.static(path.join(__dirname, 'public')));

// Server Config
var port = process.env.PORT || 8889;
var mongo_uri = process.env.db_url || 'mongodb://localhost/personal'

let db_promise = MongoClient.connect(mongo_uri)
  .then(function(db){
    app.listen(port, () => {
      db_promise.ready = true
      db_promise.db = db
      console.log('Server listening on '+port)
      console.log('Mongo is available: ' + db_promise.ready)
    })
  })


// app.get("/", function(request, response){
//   const photo_collection = db_promise.db.collection("photos")
//   const section_collection = db_promise.db.collection("sections")
//   let section_promise = new Promise(function(resolve, reject){
//     section_collection.find({}).toArray(function(err, data){
//       resolve(data)
//     })
//   })
//   let albums_promise = section_promise.then(function(sections){
//     // each section is {name: '', cover_photo: ''}
//     album_sections = sections.map(function(section){
//       return new Promise(function(resolve, reject){
//         let query = {"image_id": section["cover_photo"]}
//         photo_collection.findOne(query, function(err, doc){
//           let result = {
//             "section": section["name"],
//             "img_src": doc["src"]
//           }
//           resolve(result)
//         })
//       })
//     })
//     return Promise.all(album_sections)
//   })
//   albums_promise.then((result)=>{
//     response.render('empty-dynamic-light-gallery', {photos: result})
//   })
//
// })

// app.get("/", function(request, response){
//   const photo_collection = db_promise.db.collection("photos")
//   const section_collection = db_promise.db.collection("sections")
//   let section_promise = new Promise(function(resolve, reject){
//     section_collection.find({}).toArray(function(err, data){
//       resolve(data)
//     })
//   })
//   section_promise.then(function(sections){
//     // each section is {name: '', cover_photo: ''}
//     album_sections = sections.map(function(section){
//       result = {
//         "section": section["name"],
//         "img_src": section["cover_photo"]
//       }
//       return result
//     })
//     response.render('empty-dynamic-light-gallery', {photos: album_sections})
//   })
// })


function build_member_light_gallery_entry(photo_entry){
  if (photo_entry["type"]==="image") {
    return {
      "src": "static/photos/all-photos/" + photo_entry["image_id"],
      "thumb":"static/photos/all-photos/" + photo_entry["image_id"],
      "subHtml": photo_entry["caption"]}
    } else {
      return {
        "thumb": "static/img/video-play.png",
        "html": '<video class="lg-video-object lg-html5" controls preload="none"><source src="video/'+photo_entry["image_id"]+'" type="video/mp4">Your browser does not support HTML5 video</video>',
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

app.get("/video/:file", function(req, res){
  let vid_name = req.params.file
  const mypath = path.join(__dirname, 'public','photos','all-photos',vid_name)
    const stat = fs.statSync(mypath)
    const fileSize = stat.size
    const range = req.headers.range
    if (range) {

      const parts = range.replace(/bytes=/, "").split("-")
      const start = parseInt(parts[0], 10)
      const end = parts[1]
        ? parseInt(parts[1], 10)
        : fileSize-1
      const chunksize = (end-start)+1
      const file = fs.createReadStream(mypath, {start, end})
      const head = {
        'Content-Range': `bytes ${start}-${end}/${fileSize}`,
        'Accept-Ranges': 'bytes',
        'Content-Length': chunksize,
        'Content-Type': 'video/quicktime',
      }
      res.writeHead(206, head);
      console.log("writing stream")
      file.pipe(res);
    } else {
      const head = {
        'Content-Length': fileSize,
        'Content-Type': 'video/quicktime',
      }
      res.writeHead(200, head)
      console.log("creating stream")
      fs.createReadStream(mypath).pipe(res)
    }
  });
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
       response.render('albums-version-3', {photos: data})
     })

  })
})
