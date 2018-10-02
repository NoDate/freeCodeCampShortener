'use strict';

var express = require('express');
var mongo = require('mongodb');
var mongoose = require('mongoose');
var bodyParser = require('body-parser');
var dns = require('dns');
var { URL } = require('url');

var cors = require('cors');

var app = express();

// Basic Configuration 
var port = process.env.PORT || 3000;

/** this project needs a db !! **/ 
mongoose.connect(process.env.MONGOLAB_URI);

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

app.use(cors());

// Get database
let db = mongoose.connection;

// Create url schema
let urlSchema = new mongoose.Schema({
  id: Number,
  url: String
});  

// Create url model
let urlModel = db.model('url', urlSchema);

/** this project needs to parse POST bodies **/
// you should mount the body-parser here

app.use('/public', express.static(process.cwd() + '/public'));

app.get('/', function(req, res){
  res.sendFile(process.cwd() + '/views/index.html');
});
  
// your first API endpoint... 
app.get("/api/shorturl/:id", function (req, res) {
  // Get matching url
  urlModel.findOne({
      id: req.params.id
    }, (err, data) => {
      if(!data) {
        // Send error message
        res.json({
          error: 'Short url not found'
        });
      } else {
      // Redirect to url
      res.redirect(data.url);
      }
  });
  
  
});

// Add url and short id to list
app.post('/api/shorturl/new', (req, res) => {
  
  let newURL;
  try {
    // Convert string to URL
    newURL = new URL(req.body.url);
  } catch (e) {
    // Return error
    res.json({
      error: 'invalid URL'
    });
  }
    
  // Check if valid address
  dns.lookup(newURL.hostName, (err, addresses, family) => {
    if (err) {
      // Return error
      res.json({
        error: 'invalid URL'
      });
    } else {
      // Check if url already exists
      urlModel.findOne({
          url: req.body.url
        }, (err, urlData) => {
          // Return url data
          if (urlData !== null) {
            res.json({
              original_url: urlData.url,
              short_url: urlData.id
            });
          } else {
            // Get url count
            urlModel.count({}, (err, countData) => {
              // Get next id
              let newId = countData + 1;

              // Create new url from post
              let newUrlModel = new urlModel({
                  id: newId,
                  url: req.body.url
              });

              // Save new url
              newUrlModel.save((err, urlData) => {
                // Return results
                res.json({
                  original_url: urlData.url,
                  short_url: urlData.id
                });
              });
            });
          }
      });
    }
  });
});

app.listen(port, function () {
  console.log('Node.js listening ...');
});
