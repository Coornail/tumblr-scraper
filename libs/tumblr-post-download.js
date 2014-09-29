'use strict';

var tumblr = require('tumblr.js');

function getPhotosFromBlog(blogName, options, callback) {
  var maxPostsPerPage = 20;

  options.limit = maxPostsPerPage;
  options.offset = (options.page === undefined) ? 0 : options.page*maxPostsPerPage;

  var photos = [];

  var client = tumblr.createClient(require('../config/tumblr.json'));
  if (!client) {
    callback("Could not connect to Tumblr.");
    return;
  }

  client.posts(blogName, options, function(err, data) {
    if (err) {
      callback("Authentication failure.\nYou might have to set up config/tumblr.json first.");
      return;
    }

    data.posts.forEach(function (post) {
      photos.push(post.photos);
    });

    var extracted_photos = [];
    photos.forEach(function(imageSet) {
      if (imageSet !== undefined) {
        imageSet.forEach(function(image) {
          if (image.original_size !== undefined && image.original_size.url) {
            extracted_photos.push(image.original_size.url);
          }
        });
      }
    });

    callback(null, extracted_photos);
  });
}

module.exports = getPhotosFromBlog;