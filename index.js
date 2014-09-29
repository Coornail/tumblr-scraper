'use strict';

var TumblrScraper = require('./libs/tumblr-post-download');
var cliOutput = require('./libs/cli-output');

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
  .options('destination', {
    alias : 'd',
    describe: 'Directory to download the images to.'
  })
  .argv;

// Prepare options.
var pages = [];
for (var i=0; i < argv.maxPages; i++) {
  pages.push(i);
}

var options = argv;
options.pages = pages;

// Start download pages.
var blog = new TumblrScraper(options.blog);
blog.getPhotos(options);

// Output render loop.
var view = new cliOutput(blog);
view.renderLoop();
