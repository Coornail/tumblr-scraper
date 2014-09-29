'use strict';

var DownloadHandler = require('download');
var tumblrDownloader = require('./libs/tumblr-post-download');
var async = require('async');
var _ = require('lodash');
var cliOutput = require('./libs/cli-output');
var path = require('path');
var fs = require('fs');
var logSymbols = require('log-symbols');

function downloadImages(images) {

  var downloadSingleImage = function(image, callback) {
    var destination = './' + blogName;
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

  async.eachLimit(images, argv.concurrency, downloadSingleImage);
}

var processFiles = function (err, results) {
  if (err) {
    console.error(logSymbols.error, err);
    process.abort();
  }

  results = _.flatten(results);
  cliOutput.numberOfImages = results.length;
  if (results.length > 0) {
    downloadImages(results);
  }
};

var argv = require('yargs')
  .usage('Usage: --blog [blogname]')
  .demand('blog').alias('b').describe('blog', 'Name of the blog to scrape.')
  .options('concurrency', {
    alias : 'c',
    default : 4,
    describe: 'Number of concurrent connections used to download images.'
  })
  .options('tag', {
    alias : 't',
    default : '',
    describe: 'Tag to limit the downloading to'
  })
  .options('maxPages', {
    alias : 'p',
    default : 1,
    describe: 'Maximum number of pages to scan.'
  })
  .argv;

var blogName = argv.blog;
var maxPages = argv.maxPages;
var queryOptions = {};
queryOptions.tag = argv.tag;

var queryParams = [];

for (var i=0; i<maxPages; i++) {
  queryParams[i] = _.clone(queryOptions);
  queryParams[i].page = i;
}

async.mapLimit(queryParams, argv.concurrency, function (item, cb) {tumblrDownloader(blogName, item, cb);}, processFiles);

cliOutput.blogName = blogName;
cliOutput.maxPages = maxPages;
cliOutput.tag = queryOptions.tag;
cliOutput.renderLoop();
