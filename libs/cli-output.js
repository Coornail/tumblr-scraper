'use strict';

var logSymbols = require('log-symbols');
var clivas = require('clivas');
var filesize = require('filesize');
var fs = require('fs');
var _ = require('lodash');

var TumblrScraperCliView = function(blogStream, downloader) {
  this.blog = blogStream;
  this.downloader = downloader;

  this.fsStatCache = [];
  this.fps = 15;
};

/**
 * Sets up the render loop for drawing.
 */
TumblrScraperCliView.prototype.renderLoop = function() {
  process.stdout.write(new Buffer('G1tIG1sySg==', 'base64'));
  var that = this;
  this.loop = setInterval(function() {that.draw();}, (1000/this.fps));
  this.draw();
};

TumblrScraperCliView.prototype.stopRenderLoop = function() {
  clearInterval(this.loop);
};

/**
 * Render a line for an image status.
 *
 * @see TumblrScraper.status
 */
TumblrScraperCliView.prototype.drawStatusLine = function(item) {
  switch (item.status) {
    case 'skipped':
      clivas.line('  ' + logSymbols.warning + ' {64:' + item.path + '} (skipped)');
      break;

    case 'error':
      clivas.line('  ' + logSymbols.error + ' ' + item.image + ' (' + item.error + ')');
      break;

    default:
      // Load file size asynchronously.
      var that = this;
      fs.stat(item.path, function writeFsStatCache(err, stat) {
        that.fsStatCache[item.path] = filesize(stat.size);
      });

      var statResult = '';
      if (this.fsStatCache[item.path] !== undefined) {
        statResult = '{yellow:' + this.fsStatCache[item.path] + '}';
      }

      clivas.line('  ' + logSymbols.success + ' {64:' + item.path + '} ' + statResult);
  }
};

/**
 * Callback to draw the cli output.
 */
TumblrScraperCliView.prototype.draw = function() {
  var that = this;

  var drawOutput = function() {
    clivas.clear();

    // Header.
    clivas.line(that.getHeader());
    if (that.blog.images !== undefined) {
      var symbol = (that.blog.numberOfImages === 0 ) ? logSymbols.warning : logSymbols.info;
      clivas.line(symbol + ' Downloaded ' + that.downloader.status.length + '/' + that.blog.images);
    }

    // Status lines.
    var fromLines = that.downloader.status.length - clivas.height + 3;
    if (fromLines > 0) {
      clivas.line(' ...');
      fromLines++;
    }

    _.tail(that.downloader.status, fromLines).forEach(function drawStatusLine(item) {
      that.drawStatusLine(item);
    });
  };

  drawOutput();
};

TumblrScraperCliView.prototype.getHeader = function() {
  var header = logSymbols.info;

  header += ' Downloading images from ' + this.blog.options.blog;
  if (this.blog.options.tag !== '') {
    header += '(' + this.blog.options.tag + ')';
  }

  if (!this.blog.finished) {
    header += ' [Page ' + this.blog.page + ']';
  }

  return header;
};

module.exports = TumblrScraperCliView;
