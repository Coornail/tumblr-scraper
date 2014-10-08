'use strict';

var Writable = require('stream').Writable;
var util = require('util');
var path = require('path');
var fs = require('fs');
var DownloadHandler = require('download');
var async = require('async');

function TumblrPhotoStreamDownloader(options) {
  Writable.call(this, options);

  if (options.path === undefined) {
    options.path = './' + options.blog;
  }

  this.options = options;
  this.status = [];
  this.downloadQueue = async.queue(this.download, options.concurrency);
}

util.inherits(TumblrPhotoStreamDownloader, Writable);

/**
 * Async queue worker callback to download the file.
 *
 * @see TumblrPhotoStreamDownloader.prototype._write()
 *
 * @param task
 *   Async queue task object.
 *
 * @param callback
 */
TumblrPhotoStreamDownloader.prototype.download = function(task, callback) {
  var report = task.report;

  new DownloadHandler()
    .get(task.image).dest(task.destination)
    .run(function(err) {
      if (err) {
        callback(err);
        report.status = 'error';
        report.error = err;
        task.origin.status.push(report);
      } else{
        callback();
        task.origin.status.push(report);
      }
      task.origin.emit('fileDownloaded', report);
    }
  );
};

/**
 * Stream writer callback.
 *
 * Adds images to the download queue.
 */
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
    // Add task to the queue.
    var task = {
      image: image,
      destination: destination,
      origin: this,
      imagePath: imagePath,
      report: report
    };

    this.downloadQueue.push(task, callback);
  }
};

module.exports = TumblrPhotoStreamDownloader;