/**
 * grunt-webfonts: common stuff
 *
 * @license
 * Copyright Andrey Chalkin <L2jLiga> and Artem Sapegin (http://sapegin.me). All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://github.com/L2jLiga/grunt-webfonts/LICENSE
 */

'use strict';

const glob = require('glob');
const path = require('path');

/**
 * Unicode Private Use Area start.
 * http://en.wikipedia.org/wiki/Private_Use_(Unicode)
 * @type {Number}
 */
const UNICODE_PUA_START = 0xF101;

/**
 * @font-face’s src values generation rules.
 * @type {Object}
 */
const fontsSrcsMap = {
  eot: [
    {
      ext: '.eot',
    },
    {
      ext: '.eot?#iefix',
      format: 'embedded-opentype',
      embeddable: false,
    },
  ],
  woff: [
    false,
    {
      ext: '.woff',
      format: 'woff',
      embeddable: true,
    },
  ],
  woff2: [
    false,
    {
      ext: '.woff2',
      format: 'woff2',
      embeddable: true,
    },
  ],
  ttf: [
    false,
    {
      ext: '.ttf',
      format: 'truetype',
      embeddable: true,
    },
  ],
  svg: [
    false,
    {
      ext: '.svg#{fontBaseName}',
      format: 'svg',
      embeddable: false,
    },
  ],
};

/**
 * CSS fileaname prefixes: _icons.scss.
 * @type {Object}
 */
const cssFilePrefixes = {
  _default: '',
  sass: '_',
  scss: '_',
  styl: '',
};

/**
 * @font-face’s src parts seperators.
 * @type {Object}
 */
const fontSrcSeparators = {
  _default: ',\n\t\t',
  sass: ',\n\t\t',
  scss: ',\n\t\t',
  styl: ', ',
};

/**
 * List of available font formats.
 * @type {String}
 */
const fontFormats = 'eot,woff2,woff,ttf,svg';

/**
 * Returns list of all generated font files.
 *
 * @param {Object} options
 * @return {Array}
 */
function generatedFontFiles(options) {
  const mask = options.types.length > 1 ? '*.{' + options.types + '}' : '*.' + options.types;

  return glob.sync(path.join(options.dest, options.fontFilename + mask));
}

/**
 * Returns path to font of specified format.
 *
 * @param {Object} options
 * @param {String} type Font type (see `wf.fontFormats`).
 * @return {String}
 */
function getFontPath(options, type) {
  return path.join(options.dest, options.fontFilename + '.' + type);
}

exports.UNICODE_PUA_START = UNICODE_PUA_START;
exports.fontsSrcsMap = fontsSrcsMap;
exports.cssFilePrefixes = cssFilePrefixes;
exports.fontSrcSeparators = fontSrcSeparators;
exports.fontFormats = fontFormats;
exports.generatedFontFiles = generatedFontFiles;
exports.getFontPath = getFontPath;
