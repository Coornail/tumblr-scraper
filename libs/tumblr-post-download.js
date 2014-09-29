'use strict';

var tumblr = require('tumblr.js');
var _ = require('lodash');
var cliOutput = require('./cli-output');
var async = require('async');
var path = require('path');
var fs = require('fs');
var DownloadHandler = require('download');

var TumblrScraper = function(blogName) {
  this.blogName = blogName;
};

TumblrScraper.prototype.getPhotosFromBlog = function(options, callback) {
  var that = this;
  var maxPostsPerPage = 20;

  options.limit = maxPostsPerPage;
  options.offset = (options.page === undefined) ? 0 : options.page * maxPostsPerPage;

  var photos = [];

  var client = tumblr.createClient(require('../config/tumblr.json'));
  if (!client) {
    callback("Could not connect to Tumblr.");
    return;
  }

  client.posts(this.blogName, options, function(err, data) {
    if (err) {
      callback("Authentication failure.\nYou might have to set up config/tumblr.json first.");
      return;
    }

    data.posts.forEach(function (post) {
      photos.push(post.photos);
    });

    var extracted_photos = [];
    photos.forEach(function(imageSet) {
      if (imageSet !== undefined) {
        imageSet.forEach(function(image) {
          if (image.original_size !== undefined && image.original_size.url) {
            extracted_photos.push(image.original_size.url);
          }
        });
      }
    });

    that.processFiles(null, extracted_photos);
  });
};

TumblrScraper.prototype.downloadImages = function(images) {
  var that = this;

  var downloadSingleImage = function(image, callback) {
    var destination = './' + that.blogName;
    var imagePath = destination + '/' + path.basename(image);

    var report = {
      'image': image,
      'path': imagePath
    };

    if (fs.existsSync(imagePath)) {
      report.skipped = true;
      cliOutput.addStatus(report);
      callback();
    } else {
      new DownloadHandler()
        .get(image).dest(destination)
        .run(function(err) {

          if (err) {
            callback(err);
            report.error = err;
          }

          cliOutput.addStatus(report);
          callback();
        }
      );
    }
  };

  async.eachLimit(images, 4, downloadSingleImage);
}

TumblrScraper.prototype.processFiles = function (err, results) {
  if (err) {
    console.error(logSymbols.error, err);
    process.abort();
  }

  results = _.flatten(results);
  cliOutput.numberOfImages = results.length;
  if (results.length > 0) {
    this.downloadImages(results);
  }
};

module.exports = TumblrScraper;