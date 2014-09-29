'use strict';

var DownloadHandler = require('download');
var TumblrScraper = require('./libs/tumblr-post-download');
var async = require('async');
var _ = require('lodash');
var cliOutput = require('./libs/cli-output');
var path = require('path');
var fs = require('fs');
var logSymbols = require('log-symbols');

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

var blog = new TumblrScraper(blogName);

async.mapLimit(queryParams, argv.concurrency, function (item, cb) {blog.getPhotosFromBlog(item, cb);});
//blog.getPhotosFromBlog(queryParams[0]);


cliOutput.blogName = blogName;
cliOutput.maxPages = maxPages;
cliOutput.tag = queryOptions.tag;
cliOutput.renderLoop();
