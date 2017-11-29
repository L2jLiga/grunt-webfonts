# SVG to webfont converter for Grunt
[![npm version](https://badge.fury.io/js/grunt-webfonts.svg?colorB=brightgreen)](https://www.npmjs.com/package/grunt-webfonts)
[![npm](https://img.shields.io/npm/dm/grunt-webfonts.svg?colorB=brightgreen)](https://www.npmjs.com/package/grunt-webfonts)
[![node](https://img.shields.io/node/v/grunt-webfonts.svg?colorB=brightgreen)](https://www.npmjs.com/package/grunt-webfonts)
[![License: MIT](https://img.shields.io/badge/License-MIT-brightgreen.svg)](https://opensource.org/licenses/MIT)

Generate custom icon webfonts from SVG files via Grunt. Inspired by [grunt-webfont](https://github.com/sapegin/grunt-webfont).

This task will make all you need to use font-face icon on your website: font in all needed formats, CSS/Sass/Less/Stylus and HTML demo page.


## Features

* Works on Mac, Windows and Linux.
* Very flexible.
* Supports all web font formats: WOFF, WOFF2, EOT, TTF and SVG.
* Semantic: uses [Unicode private use area](http://bit.ly/ZnkwaT).
* [Cross-browser](http://www.fontspring.com/blog/further-hardening-of-the-bulletproof-syntax/): IE8+.
* BEM or Bootstrap output CSS style.
* CSS preprocessors support.
* Data:uri embedding.
* Ligatures.
* HTML preview.
* Custom templates.

## Installation

This plugin requires Grunt 1.0.0. Note that `ttfautohint` is optional, but your generated font will not be properly hinted if it’s not installed. And make sure you don’t use `ttfautohint` 0.97 because that version won’t work.

```
npm install grunt-webfonts --save-dev
```

Then [install `ttfautohint`](http://www.freetype.org/ttfautohint/#download) (optional).

## Available Engines

Now available only `node`


## Configuration

Add somewhere in your `Gruntfile.js`:

```javascript
grunt.loadNpmTasks('grunt-webfont');
```

Inside your `Gruntfile.js` file add a section named `webfont`. See Parameters section below for details.

For more information read [grunt-webfont](https://github.com/sapegin/grunt-webfont).

## Changelog

The changelog can be found on the [CHANGELOG.md](CHANGELOG.md).

## License

The MIT License, see the included [License.md](License.md) file.
