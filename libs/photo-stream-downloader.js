'use strict';

var Writable = require('stream').Writable;
var util = require('util');
var path = require('path');
var fs = require('fs');
var DownloadHandler = require('download');

function TumblrPhotoStreamDownloader(options) {
  Writable.call(this, options);

  if (options.path === undefined) {
    options.path = './' + options.blog;
  }

  this.options = options;
  this.status = [];
}

util.inherits(TumblrPhotoStreamDownloader, Writable);

TumblrPhotoStreamDownloader.prototype._write = function(chunk, encoding, callback) {
  var that = this;

  var image = chunk.toString();

  var destination = this.options.path;
  var imagePath = destination + '/' + path.basename(image);

  var report = {
    'image': image,
    'path': imagePath,
    'status': 'success'
  };

  if ((!this.options.force) && fs.existsSync(imagePath)) {
    report.status = 'skipped';
    this.status.push(report);
    that.emit('fileDownloaded', report);
    callback();
  } else {
    new DownloadHandler()
      .get(image).dest(destination)
      .run(function(err) {
        if (err) {
          callback(err);
          report.status = 'error';
          report.error = err;
        }

        that.status.push(report);
        that.emit('fileDownloaded', report);
        callback();
      }
    );
  }
};

module.exports = TumblrPhotoStreamDownloader;