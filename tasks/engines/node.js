'use strict';
/**
 * grunt-webfont: Node.js engine
 *
 * @requires ttfautohint 1.00+ (optional)
 * @author Artem Sapegin (http://sapegin.me)
 */

module.exports = function nodeEngine(o, allDone) {
  const [fs, path, async, temp, exec] = [require('fs'), require('path'), require('async'), require('temp'), require('child_process').exec];
  const [StringDecoder, SVGIcon2SVGFontStream, svg2ttf, ttf2eot, ttf2woff, SVGO, MemoryStream] = [require('string_decoder').StringDecoder, require('svgicons2svgfont'), require('svg2ttf'), require('ttf2eot'), require('ttf2woff'), require('svgo'), require('memorystream')];
  const logger = o.logger;

  const wf = require('../util/util'); // @todo Ligatures


  const fonts = {};
  const generators = {
    svg(done) {
      let font = '';
      const decoder = new StringDecoder('utf8');
      svgFilesToStreams(o.files, streams => {
        const stream = new MemoryStream();
        const fontStream = new SVGIcon2SVGFontStream({
          fontName: o.fontFamilyName,
          fontHeight: o.fontHeight,
          descent: o.descent,
          normalize: o.normalize,
          round: o.round,
          log: logger.verbose.bind(logger),
          error: logger.error.bind(logger)
        });
        fontStream.pipe(stream);
        stream.on('data', chunk => {
          font += decoder.write(chunk);
        });
        stream.on('end', () => {
          fonts.svg = font;
          done(font);
        });
        streams.forEach(glyph => {
          const glyphStream = new MemoryStream(glyph.stream);
          glyphStream.metadata = {
            unicode: ['\\u' + glyph.codepoint.toString().toUpperCase()],
            name: glyph.name
          };
          fontStream.write(glyphStream);
        });
        fontStream.end();
      });
    },

    ttf(done) {
      getFont('svg', svgFont => {
        let font = svg2ttf(svgFont, {});
        font = new Buffer(font.buffer);
        autohintTtfFont(font, hintedFont => {
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
      getFont('ttf', ttfFont => {
        let font = ttf2woff(new Uint8Array(ttfFont), {});
        font = new Buffer(font.buffer);
        fonts.woff = font;
        done(font);
      });
    },

    woff2(done) {
      // Will be converted from TTF later
      done();
    },

    eot(done) {
      getFont('ttf', ttfFont => {
        let font = ttf2eot(new Uint8Array(ttfFont));
        font = new Buffer(font.buffer);
        fonts.eot = font;
        done(font);
      });
    }

  };
  const steps = []; // Font types

  const typesToGenerate = o.types.slice();
  if (o.types.indexOf('woff2') !== -1 && o.types.indexOf('ttf' === -1)) typesToGenerate.push('ttf');
  typesToGenerate.forEach(type => {
    steps.push(createFontWriter(type));
  }); // Run!

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
    return done => {
      getFont(type, font => {
        fs.writeFileSync(wf.getFontPath(o, type), font);
        done();
      });
    };
  }
  /**
   * Convert svg files to streams
   *
   * @param {File} files
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
        fileDone(null, {
          codepoint: o.codepoints[name],
          name,
          stream
        });
      }
      /**
       * Create read stream
       *
       * @param {String} name
       * @param {File} file
       */


      function streamSVG(name, file) {
        const stream = fs.createReadStream(file);
        fileStreamed(name, stream);
      }
      /**
       * Stream files into SVGO
       *
       * @param {String} name
       * @param {File} file
       */


      function streamSVGO(name, file) {
        const svg = fs.readFileSync(file, 'utf8');
        const svgo = new SVGO();
        svgo.optimize(svg).then(res => {
          const stream = new MemoryStream(res.data, {
            writable: false
          });
          fileStreamed(name, stream);
        }).catch(err => {
          logger.error('Can’t simplify SVG file with SVGO.\n\n' + err);
          fileDone(err);
        });
      }

      const idx = files.indexOf(file);
      const name = o.glyphs[idx];

      if (o.optimize === true) {
        streamSVGO(name, file);
      } else {
        streamSVG(name, file);
      }
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
    } // Save original font to temporary directory


    fs.writeFileSync(originalFilepath, font); // Run ttfautohint

    const args = ['ttfautohint', '--symbol', '--fallback-script=latn', '--windows-compatibility', '--no-info', originalFilepath, hintedFilepath].join(' ');
    exec(args, {
      maxBuffer: o.execMaxBuffer
    }, err => {
      if (err) {
        if (err.code === 127) {
          logger.verbose('Hinting skipped, ttfautohint not found.');
          done(false);
          return;
        }

        logger.error('Can’t run ttfautohint.\n\n' + err.message);
        done(false);
        return;
      } // Read hinted font back


      const hintedFont = fs.readFileSync(hintedFilepath);
      done(hintedFont);
    });
  }
};
