'use strict';

var logSymbols = require('log-symbols');
var clivas = require('clivas');
var filesize = require('filesize');
var fs = require('fs');
var _ = require('lodash');

var cliOutput = {
  numberOfImages: undefined,
  maxPages: undefined,
  blogName: undefined,
  tag: undefined,
  status: []
};

/**
 * Adds a status report line.
 *
 * @param report
 *   {
 *     image: [image filename],
 *     error: (Optional) error string
 *   }
 */
cliOutput.addStatus = function(report) {
  this.status.push(report);
};

/**
 * Sets up the render loop for drawing.
 */
cliOutput.renderLoop = function() {
  process.stdout.write(new Buffer('G1tIG1sySg==', 'base64'));
  cliOutput.loop = setInterval(this.draw, 500);
  this.draw();
};

cliOutput.drawStatusLine = function(item) {
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
cliOutput.draw = function() {
  clivas.clear();
  clivas.line(logSymbols.info + ' Downloading ' + cliOutput.maxPages + ' pages from ' + cliOutput.blogName + ((cliOutput.tag !== '') ? (' (tag: ' + cliOutput.tag + ')') : ''));
  if (cliOutput.numberOfImages !== undefined) {
    var symbol = (cliOutput.numberOfImages === 0 ) ? logSymbols.warning : logSymbols.info;
    clivas.line(symbol + ' Downloaded ' + cliOutput.status.length + '/' + cliOutput.numberOfImages);
  }

  var fromLines = cliOutput.status.length - 32;
  _.tail(cliOutput.status, fromLines).forEach(cliOutput.drawStatusLine);

  if (cliOutput.numberOfImages === cliOutput.status.length) {
    clearInterval(cliOutput.loop);
  }
};

module.exports = cliOutput;
