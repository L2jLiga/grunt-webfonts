/**
 * grunt-webfont: Node.js engine
 *
 * @requires ttfautohint 1.00+ (optional)
 * @license
 * Copyright Andrey Chalkin <L2jLiga> and Artem Sapegin (http://sapegin.me). All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://github.com/L2jLiga/grunt-webfonts/LICENSE
 */

'use strict';
const fs = require('fs');
const path = require('path');
const async = require('async');
const temp = require('temp');
const exec = require('child_process').exec;
const SVGIcons2SVGFontStream = require('svgicons2svgfont');
const svg2ttf = require('svg2ttf');
const ttf2eot = require('ttf2eot');
const ttf2woff = require('ttf2woff');
const svgToPath = require('path-that-svg').default;
const MemoryStream = require('memorystream');

module.exports = function nodeEngine(o, allDone) {
  const logger = o.logger;
  const wf = require('../util/util');

  const fonts = {};
  const generators = {
    svg(done) {
      let font = '';

      svgFilesToStreams(o.files, (streams) => {
        const fontStream = new SVGIcons2SVGFontStream({
          fontName: o.fontFamilyName,
          fontHeight: o.fontHeight,
          descent: o.descent,
          centerHorizontally: o.centerHorizontally,
          normalize: o.normalize,
          round: o.round,
          log: logger.verbose.bind(logger),
          error: logger.error.bind(logger),
        });

        fontStream.on('data', (chunk) => {
          font += chunk.toString('utf8');
        });

        fontStream.on('finish', () => {
          fonts.svg = font;
          done(font);
        });

        streams.forEach((glyphStream) => fontStream.write(glyphStream));

        fontStream.end();
      });
    },

    ttf(done) {
      getFont('svg', (svgFont) => {
        let font = svg2ttf(svgFont, {});
        font = Buffer.from(font.buffer);

        autohintTtfFont(font, (hintedFont) => {
          // ttfautohint is optional
          if (hintedFont) {
            font = hintedFont;
          }

          fonts.ttf = font;
          done(font);
        });
      });
    },

    woff(done) {
      getFont('ttf', (ttfFont) => {
        let font = ttf2woff(new Uint8Array(ttfFont), {});
        font = Buffer.from(font.buffer);
        fonts.woff = font;
        done(font);
      });
    },

    woff2(done) {
      // Will be converted from TTF later
      done();
    },

    eot(done) {
      getFont('ttf', (ttfFont) => {
        let font = ttf2eot(new Uint8Array(ttfFont));
        font = Buffer.from(font.buffer);
        fonts.eot = font;
        done(font);
      });
    },
  };

  const steps = [];

  // Font types
  const typesToGenerate = o.types.slice();

  if (o.types.indexOf('woff2') !== -1 && o.types.indexOf('ttf') === -1) typesToGenerate.push('ttf');

  typesToGenerate.forEach((type) => {
    steps.push(createFontWriter(type));
  });

  // Run!
  async.waterfall(steps, allDone);

  /**
   * Get font
   *
   * @param {String} type
   * @param {Function} done
   */
  function getFont(type, done) {
    if (fonts[type]) {
      done(fonts[type]);
    } else {
      generators[type](done);
    }
  }

  /**
   * Create font writer
   * @param {String} type
   * @return {Function}
   */
  function createFontWriter(type) {
    return (done) => {
      getFont(type, (font) => {
        fs.writeFileSync(wf.getFontPath(o, type), font);
        done();
      });
    };
  }

  /**
   * Convert svg files to streams
   *
   * @param {Array} files
   * @param {Function} done
   */
  function svgFilesToStreams(files, done) {
    async.map(files, (file, fileDone) => {
      /**
       * File streamed
       *
       * @param {String} name
       * @param {Stream} stream
       */
      function fileStreamed(name, stream) {
        stream.metadata = {
          unicode: [String.fromCodePoint(o.codepoints[name])],
          name,
        };
        if (o.ligaturesOnly) {
          stream.metadata.unicode = [name];
        } else if (o.addLigatures) {
          stream.metadata.unicode.push(name);
        }

        fileDone(null, stream);
      }

      const idx = files.indexOf(file);
      const name = o.glyphs[idx];

      const svg = fs.readFileSync(file, 'utf8');

      svgToPath(svg).then((data) => {
        const stream = new MemoryStream(data, {
          writable: false,
        });

        fileStreamed(name, stream);
      }).catch((err) => {
        logger.error('Can’t simplify SVG file with SVGO.\n\n' + err);
        fileDone(err);
      });
    }, (err, streams) => {
      if (err) {
        logger.error('Can’t stream SVG file.\n\n' + err);
        allDone(false);
      } else {
        done(streams);
      }
    });
  }

  /**
   * Call to autohint
   *
   * @param {File} font
   * @param {Function} done
   */
  function autohintTtfFont(font, done) {
    const tempDir = temp.mkdirSync();
    const originalFilepath = path.join(tempDir, 'font.ttf');
    const hintedFilepath = path.join(tempDir, 'hinted.ttf');

    if (!o.autoHint) {
      done(false);
      return;
    }
    // Save original font to temporary directory
    fs.writeFileSync(originalFilepath, font);

    // Run ttfautohint
    const args = [
      'ttfautohint',
      '--symbol',
      '--fallback-script=latn',
      '--windows-compatibility',
      '--no-info',
      originalFilepath,
      hintedFilepath,
    ].join(' ');

    exec(args, {maxBuffer: o.execMaxBuffer}, (err) => {
      if (err) {
        if (err.code === 127) {
          logger.verbose('Hinting skipped, ttfautohint not found.');
          done(false);
          return;
        }
        logger.error('Can’t run ttfautohint.\n\n' + err.message);
        done(false);
        return;
      }

      // Read hinted font back
      const hintedFont = fs.readFileSync(hintedFilepath);
      done(hintedFont);
    });
  }
};
