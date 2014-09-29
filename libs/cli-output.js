'use strict';

var logSymbols = require('log-symbols');
var clivas = require('clivas');
var filesize = require('filesize');
var fs = require('fs');
var _ = require('lodash');

var TumblrScraperCliView = function(blog) {
  this.blog = blog;
};

/**
 * Sets up the render loop for drawing.
 */
TumblrScraperCliView.prototype.renderLoop = function() {
  process.stdout.write(new Buffer('G1tIG1sySg==', 'base64'));
  var that = this;
  this.loop = setInterval(function() {that.draw();}, 1000);
  this.draw();
};

TumblrScraperCliView.prototype.drawStatusLine = function(item) {
  if (item.skipped !== undefined) {
    clivas.line('  ' + logSymbols.warning + ' {64:' + item.path + '} (skipped)');
    return;
  }

  if (item.error === undefined){
    var stats = fs.statSync(item.path);
    clivas.line('  ' + logSymbols.success + ' {64:' + item.path + '} ' + '{yellow:' + filesize(stats.size) + '}');
  } else {
    clivas.line('  ' + logSymbols.error + ' ' + item.image + ' (' + item.error + ')');
  }
};

/**
 * Callback to draw the cli output.
 */
TumblrScraperCliView.prototype.draw = function() {
  clivas.clear();
  clivas.line(logSymbols.info + ' Downloading ' + this.blog.pages.length + ' pages from ' + this.blog.blogName + ((this.blog.tag !== '') ? (' (tag: ' + this.blog.tag + ')') : ''));
  if (this.blog.numberOfImages !== undefined) {
    var symbol = (this.blog.numberOfImages === 0 ) ? logSymbols.warning : logSymbols.info;
    clivas.line(symbol + ' Downloaded ' + this.blog.status.length + '/' + this.blog.numberOfImages);
  }

  var fromLines = this.blog.status.length - 32;
  _.tail(this.blog.status, fromLines).forEach(this.drawStatusLine);

  if (this.blog.numberOfImages === this.blog.status.length) {
    clearInterval(this.loop);
  }
};

module.exports = TumblrScraperCliView;
