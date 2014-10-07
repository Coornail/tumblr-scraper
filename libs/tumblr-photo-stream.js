'use strict';

var _ = require('lodash');
var Readable = require('stream').Readable;
var tumblr = require('tumblr.js');
var util = require('util');
var jsonPath = require('JSONPath');

function TumblrPhotoStream(options) {
  Readable.call(this, options);

  this.options = options;
  this.options.limit = 20;

  this.page = 0;
  this.status = [];
  this.images = 0;
  this.finished = false;

  this.pageStatus = [];
  this.firstEmptyPage = Number.MAX_VALUE;
}

util.inherits(TumblrPhotoStream, Readable);

TumblrPhotoStream.prototype._read = function() {
  // We know we won't find anything after the first empty page.
  if (this.page > this.firstEmptyPage || this.page >= this.options.maxPages) {
    return;
  }

  // Mark page for downloading.
  this.pageStatus[this.page] = -1;

  this.options.offset = this.page * this.options.limit;

  var client = tumblr.createClient(require('../config/tumblr.json'));
  if (!client) {
    throw new Error('Could not connect to Tumblr.');
  }

  var that = this;
  var page = this.page;
  client.posts(this.options.blog, this.options, function(err, data) {
    if (err) {
      throw new Error('Authentication failure.\nYou might have to set up config/tumblr.json first.');
    }

    /* jshint evil:true */
    // Not the eval() we hate.
    var extractedPhotos = jsonPath.eval(data.posts, '*.photos.*.original_size.url');
    extractedPhotos = _.flatten(extractedPhotos);

    extractedPhotos.forEach(function(item) {
      that.images++;
      that.push(item);
    });

    that.pageStatus[page] = extractedPhotos.length;

    // Test if we can finish the stream.
    if (extractedPhotos.length === 0 && page < that.firstEmptyPage) {
      that.firstEmptyPage = page;
    }

    // If we got results back from all the pages we started downloading, we finish the stream.
    if (that.isPagesFinished()) {
      that.finished = true;
      return that.push(null);
    }
  });

  this.page++;
};

TumblrPhotoStream.prototype.isPagesFinished = function() {
  var pagesQueued = _.first(this.pageStatus, this.firstEmptyPage);
  var finishedQueuedPages = _.every(pagesQueued, function(item) {return item > -1;});

  return (pagesQueued.length > 0 && finishedQueuedPages);
};

module.exports = TumblrPhotoStream;
