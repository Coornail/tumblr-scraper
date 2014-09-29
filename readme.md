Tumblr scraper
==============
Batch download images from a Tumblr blog.

<img src="https://i.imgur.com/n4Ep1c3.png" alt="tumblr-scraper in action" width="400px" />

To use
------
* Go to https://www.tumblr.com/oauth/register
* Register an application

```sh
$ git clone git@github.com:Coornail/tumblr-scraper.git
$ cd tumblr-scraper
$ npm install
$ $EDITOR config/tumblr.json
```
Fill in application credentials got after the registration.

```
$ node index.js --blog [blogname] (--tag [tagname])
```

For more information:
```sh
$ node index.js
```
