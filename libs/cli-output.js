'use strict';

var logSymbols = require('log-symbols');
var clivas = require('clivas');
var filesize = require('filesize');
var fs = require('fs');
var _ = require('lodash');

var TumblrScraperCliView = function(blog) {
  this.blog = blog;
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
    clivas.line(logSymbols.info + ' Downloading ' + that.blog.pages.length + ' pages from ' + that.blog.blogName + ((that.blog.tag !== '') ? (' (tag: ' + that.blog.tag + ')') : ''));
    if (that.blog.numberOfImages !== undefined) {
      var symbol = (that.blog.numberOfImages === 0 ) ? logSymbols.warning : logSymbols.info;
      clivas.line(symbol + ' Downloaded ' + that.blog.status.length + '/' + that.blog.numberOfImages);
    }

    // Status lines.
    var fromLines = that.blog.status.length - clivas.height + 3;
    if (fromLines > 0) {
      clivas.line(' ...');
      fromLines++;
    }

    _.tail(that.blog.status, fromLines).forEach(function drawStatusLine(item) {
      that.drawStatusLine(item);
    });
  };

  drawOutput();

  // Remove render loop when we've finished.
  if (this.blog.numberOfImages === this.blog.status.length) {
    clearInterval(this.loop);

    // Schedule a final frame in 10ms (to render the filesize of the last
    // lines).
    setTimeout(drawOutput, 10);
  }
};

module.exports = TumblrScraperCliView;
