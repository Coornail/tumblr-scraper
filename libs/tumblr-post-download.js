'use strict';

var tumblr = require('tumblr.js');
var _ = require('lodash');
var async = require('async');
var path = require('path');
var fs = require('fs');
var DownloadHandler = require('download');
var logSymbols = require('log-symbols');
var jsonPath = require('JSONPath');

var TumblrScraper = function(blogName) {
  this.blogName = blogName;
  this.status = [];
  this.tag = '';
  this.pages = [];
  this.concurrency = 4;
  this.force = false;
};

/**
 * Get photos based on some criteria.
 *
 * @param options object
 *   Criteria for the image download.
 *   Possible options:
 *     - tag (string): Tumblr tag to limit the query to.
 *     - destination (string): Directory to download the files.
 *     - concurrency (int): How many concurrent threads used to download the files.
 *     - force (bool): Overwrite existing files.
 *     - pages (array): Pages of posts to download.
 */
TumblrScraper.prototype.getPhotos = function(options) {
  var that = this;

  this.tag = options.tag || '';
  this.pages = options.pages || [1];
  this.destination = options.destination || './' + this.blogName + '/';
  this.concurrency = options.concurrency || 4;
  this.force = options.force || false;

  // Prepare query params.
  var queryParams = [];
  options.pages.forEach(function(item) {
    var downloadOptions = _.clone(options);
    delete downloadOptions.pages;
    downloadOptions.page = item;
    queryParams.push(downloadOptions);
  });

  var processCallback = function(err, results) {
    that.processFiles(err, results);
  };

  async.mapLimit(queryParams, this.concurrency, function (item, cb) {that.processPage(item, cb);}, processCallback);
};

TumblrScraper.prototype.processPage = function(options, callback) {
  var maxPostsPerPage = 20;

  options.limit = maxPostsPerPage;
  options.offset = (options.page === undefined) ? 0 : options.page * maxPostsPerPage;

  var client = tumblr.createClient(require('../config/tumblr.json'));
  if (!client) {
    callback('Could not connect to Tumblr.');
    return;
  }

  client.posts(this.blogName, options, function(err, data) {
    if (err) {
      callback('Authentication failure.\nYou might have to set up config/tumblr.json first.');
      return;
    }

    /* jshint evil:true */
    // Not the eval() we hate.
    var extractedPhotos = jsonPath.eval(data.posts, '*.photos.*.original_size.url');
    callback(null, extractedPhotos);
  });
};

TumblrScraper.prototype.downloadImages = function(images) {
  var that = this;

  var downloadSingleImage = function(image, callback) {
    var destination = that.destination;
    var imagePath = destination + '/' + path.basename(image);

    var report = {
      'image': image,
      'path': imagePath
    };

    if ((!that.force) && fs.existsSync(imagePath)) {
      report.skipped = true;
      that.status.push(report);
      callback();
    } else {
      new DownloadHandler()
        .get(image).dest(destination)
        .run(function(err) {

          if (err) {
            callback(err);
            report.error = err;
          }

          that.status.push(report);
          callback();
        }
      );
    }
  };

  async.eachLimit(images, this.concurrency, downloadSingleImage);
};

TumblrScraper.prototype.processFiles = function (err, results) {
  if (err) {
    console.error(logSymbols.error, err);
    process.abort();
  }

  results = _.flatten(results);
  this.numberOfImages = (this.numberOfImages || 0) + results.length;
  if (results.length > 0) {
    this.downloadImages(results);
  }
};

module.exports = TumblrScraper;