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
}

util.inherits(TumblrPhotoStream, Readable);

TumblrPhotoStream.prototype._read = function() {
  var that = this;

  this.options.offset = this.page * this.options.limit;

  var client = tumblr.createClient(require('../config/tumblr.json'));
  if (!client) {
    throw new Error('Could not connect to Tumblr.');
  }

  client.posts(this.options.blog, this.options, function(err, data) {
    if (err) {
      throw new Error('Authentication failure.\nYou might have to set up config/tumblr.json first.');
    }

    /* jshint evil:true */
    // Not the eval() we hate.
    var extractedPhotos = jsonPath.eval(data.posts, '*.photos.*.original_size.url');
    extractedPhotos = _.flatten(extractedPhotos);

    // If we got no results back, we end the stream.
    if (extractedPhotos.length === 0) {
      that.finished = true;
      that.push(null);
    }

    if (!that.finished) {
      extractedPhotos.forEach(function(item) {
        that.images++;
        that.push(item);
      });
    }

  });

  this.page++;
};

module.exports = TumblrPhotoStream;
