#!/usr/bin/env node

'use strict';

var TumblrPhotoStream = require('./libs/tumblr-photo-stream');
var TumblrPhotoStreamDownloader = require('./libs/photo-stream-downloader');
var cliOutput = require('./libs/cli-output');
var _ = require('lodash');
var through = require('through');

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
  .boolean('force').describe('force', 'Download images even if they exists in the current directory.').default('force', false)
  .options('destination', {
    alias : 'd',
    describe: 'Directory to download the images to.'
  })
  .argv;

// Prepare options.
var options = argv;
options.pages = _.range(argv.maxPages);

var blogStream = new TumblrPhotoStream(options);
var downloader = new TumblrPhotoStreamDownloader(options);
var view = new cliOutput(blogStream, downloader);

downloader.on('finish', function() {
  view.stopRenderLoop();
});

blogStream.pipe(downloader);

// Output render loop.
view.renderLoop();
