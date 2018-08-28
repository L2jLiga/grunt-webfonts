/**
 * SVG to webfont converter for Grunt
 *
 * @requires ttfautohint
 * @license
 * Copyright Andrey Chalkin <L2jLiga> and Artem Sapegin (http://sapegin.me). All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://github.com/L2jLiga/grunt-webfonts/LICENSE
 */
'use strict';

module.exports = function webFonts(grunt) {
  const [fs, path, async, glob, chalk, mkdirp, crypto, ttf2woff2, _] = [require('fs'), require('path'), require('async'), require('glob'), require('chalk'), require('mkdirp'), require('crypto'), require('ttf2woff2'), require('lodash')];

  const wf = require('./util/util');

  grunt.registerMultiTask('webfont', 'Compile separate SVG files to webfont', function WebFont() {
    /**
     * Winston to Grunt logger adapter.
     */
    const format = Symbol('format');
    const logger = {
      warn(...args) {
        const msg = this[format](...args);

        if (arguments.length > 0) {
          grunt.log.writeln('>> '.red + _.trim(msg).replace(/\n/g, '\n>> '.red));
        } else {
          grunt.log.writeln('ERROR'.red);
        }

        return this;
      },

      error(...args) {
        grunt.log.error(...args);
      },

      log(...args) {
        grunt.log.writeln(...args);
      },

      verbose(...args) {
        grunt.verbose.writeln(...args);
      },

      [format](sep, pathObject) {
        const dir = pathObject.dir || pathObject.root;
        const base = pathObject.base || (pathObject.name || '') + (pathObject.ext || '');

        if (!dir) {
          return base;
        }

        if (dir === pathObject.root) {
          return dir + base;
        }

        return dir + sep + base;
      }

    };
    const allDone = this.async();
    const params = this.data;
    const options = this.options();
    const md5 = crypto.createHash('md5');
    /*
     * Check for `src` param on target config
     */

    this.requiresConfig([this.name, this.target, 'src'].join('.'));
    /*
     * Check for `dest` param on either target config or global options object
     */

    if (_.isUndefined(params.dest) && _.isUndefined(options.dest)) {
      logger.warn('Required property ' + [this.name, this.target, 'dest'].join('.') + ' or ' + [this.name, this.target, 'options.dest'].join('.') + ' missing.');
    }

    if (options.skip) {
      completeTask();
      return;
    } // Source files


    const files = _(this.filesSrc).filter(isSvgFile).value();

    if (!files.length) {
      logger.warn('Specified empty list of source SVG files.');
      completeTask();
      return;
    } // path must be a string, see https://nodejs.org/api/path.html#path_path_extname_path


    if (typeof options.template !== 'string') {
      options.template = '';
    } // Options


    let defaultOptions = {
      logger,
      fontBaseName: options.font || 'icons',
      destCss: options.destCss || params.destCss || params.dest,
      destScss: options.destScss || params.destScss || params.destCss || params.dest,
      destSass: options.destSass || params.destSass || params.destCss || params.dest,
      destLess: options.destLess || params.destLess || params.destCss || params.dest,
      destStyl: options.destStyl || params.destStyl || params.destCss || params.dest,
      dest: options.dest || params.dest,
      relativeFontPath: options.relativeFontPath,
      fontPathVariables: options.fontPathVariables || false,
      addHashes: options.hashes !== false,
      addLigatures: options.ligatures === true,
      template: options.template,
      syntax: options.syntax || 'bem',
      templateOptions: options.templateOptions || {},
      stylesheets: options.stylesheets || [options.stylesheet || path.extname(options.template).replace(/^\./, '') || 'css'],
      htmlDemo: options.htmlDemo !== false,
      htmlDemoTemplate: options.htmlDemoTemplate,
      htmlDemoFilename: options.htmlDemoFilename,
      styles: optionToArray(options.styles, 'font,icon'),
      types: optionToArray(options.types, 'eot,woff,ttf'),
      order: optionToArray(options.order, wf.fontFormats),
      embed: options.embed === true ? ['woff'] : optionToArray(options.embed, false),
      rename: options.rename || path.basename,
      engine: options.engine || 'node',
      autoHint: options.autoHint !== false,
      codepoints: options.codepoints,
      codepointsFile: options.codepointsFile,
      startCodepoint: options.startCodepoint || wf.UNICODE_PUA_START,
      ie7: options.ie7 === true,
      centerHorizontally: options.centerHorizontally === true,
      normalize: options.normalize === true,
      optimize: options.optimize === true,
      round: options.round !== undefined ? options.round : 10e12,
      fontHeight: options.fontHeight !== undefined ? options.fontHeight : 512,
      descent: options.descent !== undefined ? options.descent : 64,
      version: options.version !== undefined ? options.version : false,
      cache: options.cache || path.join(__dirname, '..', '.cache'),
      callback: options.callback,
      customOutputs: options.customOutputs,
      execMaxBuffer: options.execMaxBuffer || 1024 * 200
    };
    defaultOptions = _.extend(defaultOptions, {
      fontName: defaultOptions.fontBaseName,
      destCssPaths: {
        css: defaultOptions.destCss,
        scss: defaultOptions.destScss,
        sass: defaultOptions.destSass,
        less: defaultOptions.destLess,
        styl: defaultOptions.destStyl
      },
      relativeFontPath: defaultOptions.relativeFontPath || path.relative(defaultOptions.destCss, defaultOptions.dest),
      destHtml: options.destHtml || defaultOptions.destCss,
      fontfaceStyles: has(defaultOptions.styles, 'font'),
      baseStyles: has(defaultOptions.styles, 'icon'),
      extraStyles: has(defaultOptions.styles, 'extra'),
      files,
      glyphs: []
    });
    defaultOptions.hash = getHash();
    defaultOptions.fontFilename = template(options.fontFilename || defaultOptions.fontBaseName, defaultOptions);
    defaultOptions.fontFamilyName = template(options.fontFamilyName || defaultOptions.fontBaseName, defaultOptions); // “Rename” files

    defaultOptions.glyphs = defaultOptions.files.map(file => defaultOptions.rename(file).replace(path.extname(file), '')); // Check or generate codepoints
    // @todo Codepoint can be a Unicode code or character.

    let currentCodepoint = defaultOptions.startCodepoint;
    if (!defaultOptions.codepoints) defaultOptions.codepoints = {};
    if (defaultOptions.codepointsFile) defaultOptions.codepoints = readCodepointsFromFile();
    defaultOptions.glyphs.forEach(name => {
      if (!defaultOptions.codepoints[name]) {
        defaultOptions.codepoints[name] = getNextCodepoint();
      }
    });
    if (defaultOptions.codepointsFile) saveCodepointsToFile(); // Check if we need to generate font

    const previousHash = readHash(this.name, this.target);
    logger.verbose('New hash:', defaultOptions.hash, '- previous hash:', previousHash);

    if (defaultOptions.hash === previousHash) {
      logger.verbose('Config and source files weren’t changed since last run, checking resulting files...');
      let regenerationNeeded = false;
      const generatedFiles = wf.generatedFontFiles(defaultOptions);

      if (!generatedFiles.length) {
        regenerationNeeded = true;
      } else {
        generatedFiles.push(getDemoFilePath());
        defaultOptions.stylesheets.forEach(stylesheet => {
          generatedFiles.push(getCssFilePath(stylesheet));
        });
        regenerationNeeded = _.some(generatedFiles, filename => {
          if (!filename) return false;

          if (!fs.existsSync(filename)) {
            logger.verbose('File', filename, ' is missed.');
            return true;
          }

          return false;
        });
      }

      if (!regenerationNeeded) {
        logger.log('Font ' + chalk.cyan(defaultOptions.fontName) + ' wasn’t changed since last run.');
        completeTask();
        return;
      }
    } // Save new hash and run


    saveHash(this.name, this.target, defaultOptions.hash);
    async.waterfall([createOutputDirs, cleanOutputDir, generateFont, generateWoff2Font, generateStylesheets, generateDemoHtml, generateCustomOutputs, printDone], completeTask);
    /**
     * Call callback function if it was specified in the options.
     */

    function completeTask() {
      if (defaultOptions && _.isFunction(defaultOptions.callback)) {
        defaultOptions.callback(defaultOptions.fontName, defaultOptions.types, defaultOptions.glyphs, defaultOptions.hash);
      }

      allDone();
    }
    /**
     * Calculate hash to flush browser cache.
     * Hash is based on source SVG files contents, task options and grunt-webfont version.
     *
     * @return {String}
     */


    function getHash() {
      // Source SVG files contents
      defaultOptions.files.forEach(file => {
        md5.update(fs.readFileSync(file, 'utf8'));
      }); // Options

      md5.update(JSON.stringify(defaultOptions)); // grunt-webfont version

      const packageJson = require('../package.json');

      md5.update(packageJson.version); // Templates

      if (defaultOptions.template) {
        md5.update(fs.readFileSync(defaultOptions.template, 'utf8'));
      }

      if (defaultOptions.htmlDemoTemplate) {
        md5.update(fs.readFileSync(defaultOptions.htmlDemoTemplate, 'utf8'));
      }

      return md5.digest('hex');
    }
    /**
     * Create output directory
     *
     * @param {Function} done
     */


    function createOutputDirs(done) {
      defaultOptions.stylesheets.forEach(stylesheet => {
        mkdirp.sync(option(defaultOptions.destCssPaths, stylesheet));
      });
      mkdirp.sync(defaultOptions.dest);
      done();
    }
    /**
     * Clean output directory
     *
     * @param {Function} done
     */


    function cleanOutputDir(done) {
      const htmlDemoFileMask = path.join(defaultOptions.destCss, defaultOptions.fontBaseName + '*.{css,html}');
      const files = glob.sync(htmlDemoFileMask).concat(wf.generatedFontFiles(defaultOptions));
      async.forEach(files, (file, next) => {
        fs.unlink(file, next);
      }, done);
    }
    /**
     * Generate font using selected engine
     *
     * @param {Function} done
     */


    function generateFont(done) {
      const engine = require('./engines/' + defaultOptions.engine);

      engine(defaultOptions, result => {
        if (result === false) {
          // Font was not created, exit
          completeTask();
          return;
        }

        if (result) {
          defaultOptions = _.extend(defaultOptions, result);
        }

        done();
      });
    }
    /**
     * Converts TTF font to WOFF2.
     *
     * @param {Function} done
     */


    function generateWoff2Font(done) {
      if (!has(defaultOptions.types, 'woff2')) {
        done();
        return;
      } // Read TTF font


      const ttfFontPath = wf.getFontPath(defaultOptions, 'ttf');
      const ttfFont = fs.readFileSync(ttfFontPath); // Remove TTF font if not needed

      if (!has(defaultOptions.types, 'ttf')) {
        fs.unlinkSync(ttfFontPath);
      } // Convert to WOFF2


      const woffFont = ttf2woff2(ttfFont); // Save

      const woff2FontPath = wf.getFontPath(defaultOptions, 'woff2');
      fs.writeFile(woff2FontPath, woffFont, done);
    }
    /**
     * Generate CSS
     *
     * @param {Function} done
     */


    function generateStylesheets(done) {
      // Convert codepoints to array of strings
      const codepoints = [];

      _.each(defaultOptions.glyphs, name => {
        codepoints.push(defaultOptions.codepoints[name].toString(16));
      });

      defaultOptions.codepoints = codepoints; // Prepage glyph names to use as CSS classes

      defaultOptions.glyphs = _.map(defaultOptions.glyphs, classNameize);
      defaultOptions.stylesheets.sort(keyName => keyName.indexOf('css')).forEach(generateStylesheet);
      done();
    }
    /**
     * Generate CSS
     *
     * @param {String} stylesheet type: css, scss, ...
     */


    function generateStylesheet(stylesheet) {
      defaultOptions.relativeFontPath = normalizePath(defaultOptions.relativeFontPath); // Generate font URLs to use in @font-face

      const fontSrcs = [[], []];
      defaultOptions.order.forEach(type => {
        if (!has(defaultOptions.types, type)) return;
        wf.fontsSrcsMap[type].forEach((font, idx) => {
          if (font) {
            fontSrcs[idx].push(generateFontSrc(type, font, stylesheet));
          }
        });
      }); // Convert urls to strings that could be used in CSS

      const fontSrcSeparator = option(wf.fontSrcSeparators, stylesheet);
      fontSrcs.forEach((font, idx) => {
        // defaultOptions.fontSrc1, defaultOptions.fontSrc2
        defaultOptions['fontSrc' + (idx + 1)] = font.join(fontSrcSeparator);
      });
      defaultOptions.fontRawSrcs = fontSrcs; // Read JSON file corresponding to CSS template

      const templateJson = readTemplate(defaultOptions.template, defaultOptions.syntax, '.json', true);
      if (templateJson) defaultOptions = _.extend(defaultOptions, JSON.parse(templateJson.template)); // Now override values with templateOptions

      if (defaultOptions.templateOptions) defaultOptions = _.extend(defaultOptions, defaultOptions.templateOptions); // Generate CSS
      // Use extension of defaultOptions.template file if given, or default to .css

      const ext = path.extname(defaultOptions.template) || '.css';
      defaultOptions.cssTemplate = readTemplate(defaultOptions.template, defaultOptions.syntax, ext);

      const cssContext = _.extend(defaultOptions, {
        iconsStyles: true,
        stylesheet
      });

      let css = renderTemplate(defaultOptions.cssTemplate, cssContext); // Fix CSS preprocessors comments: single line comments will be removed after compilation

      if (has(['sass', 'scss', 'less', 'styl'], stylesheet)) {
        css = css.replace(/\/\* *(.*?) *\*\//g, '// $1');
      } // Save file


      fs.writeFileSync(getCssFilePath(stylesheet), css);
    }
    /**
     * Gets the codepoints from the set filepath in defaultOptions.codepointsFile
     * @return {Object} Codepoints
     */


    function readCodepointsFromFile() {
      if (!defaultOptions.codepointsFile) return {};

      if (!fs.existsSync(defaultOptions.codepointsFile)) {
        logger.verbose('Codepoints file not found');
        return {};
      }

      const buffer = fs.readFileSync(defaultOptions.codepointsFile);
      return JSON.parse(buffer.toString());
    }
    /**
     * Saves the codespoints to the set file
     */


    function saveCodepointsToFile() {
      if (!defaultOptions.codepointsFile) return;
      const codepointsToString = JSON.stringify(defaultOptions.codepoints, null, 4);

      try {
        fs.writeFileSync(defaultOptions.codepointsFile, codepointsToString);
        logger.verbose('Codepoints saved to file "' + defaultOptions.codepointsFile + '".');
      } catch (err) {
        logger.error(err.message);
      }
    }
    /**
     * Prepares base context for templates
     * @return {Object} Base template context
     */


    function prepareBaseTemplateContext() {
      return _.extend({}, defaultOptions);
    }
    /**
     * Makes custom extends necessary for use with preparing the template context
     * object for the HTML demo.
     * @return {Object} HTML template context
     */


    function prepareHtmlTemplateContext() {
      let context = _(defaultOptions); // Prepare relative font paths for injection into @font-face refs in HTML


      const relativeRe = new RegExp(_.escapeRegExp(defaultOptions.relativeFontPath), 'g');
      const htmlRelativeFontPath = normalizePath(path.relative(defaultOptions.destHtml, defaultOptions.dest));
      context = context.extend({
        fontSrc1: defaultOptions.fontSrc1.replace(relativeRe, htmlRelativeFontPath),
        fontSrc2: defaultOptions.fontSrc2.replace(relativeRe, htmlRelativeFontPath),
        fontfaceStyles: true,
        baseStyles: true,
        extraStyles: false,
        iconsStyles: true,
        stylesheet: 'css'
      });
      return _(context).extend({
        styles: renderTemplate(defaultOptions.cssTemplate, context.value())
      }).value();
    }
    /**
     * Iterator function used as callback by looping construct below to
     * render "custom output" via mini configuration objects specified in
     * the array `options.customOutputs`.
     *
     * @param {Object} outputConfig
     */


    function generateCustomOutput(outputConfig) {
      // Accesses context
      const context = prepareBaseTemplateContext();

      _.extend(context, outputConfig.context); // Prepares config attributes related to template filepath


      const templatePath = outputConfig.template;
      const extension = path.extname(templatePath);
      const syntax = outputConfig.syntax || ''; // Renders template with given context

      const template = readTemplate(templatePath, syntax, extension);
      const output = renderTemplate(template, context); // Prepares config attributes related to destination filepath

      const dest = outputConfig.dest || defaultOptions.dest;
      let filepath;
      let destParent;
      let destName;

      if (path.extname(dest) === '') {
        // If user specifies a directory, filename should be same as template
        destParent = dest;
        destName = path.basename(outputConfig.template);
        filepath = path.join(dest, destName);
      } else {
        // If user specifies a file, that is our filepath
        destParent = path.dirname(dest);
        filepath = dest;
      } // Ensure existence of parent directory and output to file as desired


      mkdirp.sync(destParent);
      fs.writeFileSync(filepath, output);
    }
    /**
     * Iterates over entries in the `options.customOutputs` object and,
     * on a config-by-config basis, generates the desired results.
     * @param {Function} done
     */


    function generateCustomOutputs(done) {
      if (!defaultOptions.customOutputs || defaultOptions.customOutputs.length < 1) {
        done();
        return;
      }

      _.each(defaultOptions.customOutputs, generateCustomOutput);

      done();
    }
    /**
     * Generate HTML demo page
     *
     * @param {Function} done
     */


    function generateDemoHtml(done) {
      if (!defaultOptions.htmlDemo) {
        done();
        return;
      }

      const context = prepareHtmlTemplateContext(); // Generate HTML

      const demoTemplate = readTemplate(defaultOptions.htmlDemoTemplate, 'demo', '.html');
      const demo = renderTemplate(demoTemplate, context);
      mkdirp(getDemoPath(), err => {
        if (err) {
          logger.log(err);
          return;
        } // Save file


        fs.writeFileSync(getDemoFilePath(), demo);
        done();
      });
    }
    /**
     * Print log
     *
     * @param {Function} done
     */


    function printDone(done) {
      logger.log('Font ' + chalk.cyan(defaultOptions.fontName) + ' with ' + defaultOptions.glyphs.length + ' glyphs created.');
      done();
    }
    /**
     * Helpers
     */

    /**
     * Convert a string of comma separated words into an array
     *
     * @param {String} val Input string
     * @param {String} defVal Default value
     * @return {Array}
     */


    function optionToArray(val, defVal) {
      if (_.isUndefined(val)) {
        val = defVal;
      }

      if (!val) {
        return [];
      }

      if (!_.isString(val)) {
        return val;
      }

      return val.split(',').map(_.trim);
    }
    /**
     * Check if a value exists in an array
     *
     * @param {Array} haystack Array to find the needle in
     * @param {*} needle Value to find
     * @return {Boolean} Needle was found
     */


    function has(haystack, needle) {
      return haystack.indexOf(needle) !== -1;
    }
    /**
     * Return a specified option if it exists in an object or `_default` otherwise
     *
     * @param {Object} map Options object
     * @param {String} key Option to find in the object
     * @return {*}
     */


    function option(map, key) {
      return map[key in map ? key : '_default'];
    }
    /**
     * Find next unused codepoint.
     *
     * @return {Number}
     */


    function getNextCodepoint() {
      while (_.invert(defaultOptions.codepoints).hasOwnProperty(currentCodepoint)) {
        currentCodepoint++;
      }

      return currentCodepoint;
    }
    /**
     * Check whether file is SVG or not
     *
     * @param {String} filepath File path
     * @return {Boolean}
     */


    function isSvgFile(filepath) {
      return path.extname(filepath).toLowerCase() === '.svg';
    }
    /**
     * Convert font file to data:uri and remove source file
     *
     * @param {String} fontFile Font file path
     * @return {String} Base64 encoded string
     */


    function embedFont(fontFile) {
      // Convert to data:uri
      const dataUri = fs.readFileSync(fontFile, 'base64');
      const type = path.extname(fontFile).substring(1);
      const fontUrl = 'data:application/x-font-' + type + ';charset=utf-8;base64,' + dataUri; // Remove font file

      fs.unlinkSync(fontFile);
      return fontUrl;
    }
    /**
     * Append a slash to end of a filepath if it not exists and make all slashes forward
     *
     * @param {String} filepath File path
     * @return {String}
     */


    function normalizePath(filepath) {
      if (!filepath.length) return filepath; // Make all slashes forward

      filepath = filepath.replace(/\\/g, '/'); // Make sure path ends with a slash

      if (!_.endsWith(filepath, '/')) {
        filepath += '/';
      }

      return filepath;
    }
    /**
     * Generate URL for @font-face
     *
     * @param {String} type Type of font
     * @param {Object} font URL or Base64 string
     * @param {String} stylesheet type: css, scss, ...
     * @return {String}
     */


    function generateFontSrc(type, font, stylesheet) {
      const filename = template(defaultOptions.fontFilename + font.ext, defaultOptions);
      let fontPathVariableName = defaultOptions.fontFamilyName + '-font-path';
      let url;

      if (font.embeddable && has(defaultOptions.embed, type)) {
        url = embedFont(path.join(defaultOptions.dest, filename));
      } else {
        if (defaultOptions.fontPathVariables && stylesheet !== 'css') {
          if (stylesheet === 'less') {
            fontPathVariableName = '@' + fontPathVariableName;
            defaultOptions.fontPathVariable = fontPathVariableName + ' : "' + defaultOptions.relativeFontPath + '";';
          } else {
            fontPathVariableName = '$' + fontPathVariableName;
            defaultOptions.fontPathVariable = fontPathVariableName + ' : "' + defaultOptions.relativeFontPath + '" !default;';
          }

          url = filename;
        } else {
          url = defaultOptions.relativeFontPath + filename;
        }

        if (defaultOptions.addHashes) {
          // Do not add hashes for OldIE
          if (url.indexOf('#iefix') === -1) {
            // Put hash at the end of an URL or before #hash
            url = url.replace(/(#|$)/, '?' + defaultOptions.hash + '$1');
          } else {
            url = url.replace(/(#|$)/, defaultOptions.hash + '$1');
          }
        }
      }

      let src = 'url("' + url + '")';

      if (defaultOptions.fontPathVariables && stylesheet !== 'css') {
        if (stylesheet === 'less') {
          src = 'url("@{' + fontPathVariableName.replace('@', '') + '}' + url + '")';
        } else {
          src = 'url(' + fontPathVariableName + ' + "' + url + '")';
        }
      }

      if (font.format) src += ' format("' + font.format + '")';
      return src;
    }
    /**
     * Reat the template file
     *
     * @param {String} template Template file path
     * @param {String} syntax Syntax (bem, bootstrap, etc.)
     * @param {String} ext Extention of the template
     * @param {*} optional
     * @return {Object} {filename: 'Template filename', template: 'Template code'}
     */


    function readTemplate(template, syntax, ext, optional) {
      const filename = template ? path.resolve(template.replace(path.extname(template), ext)) : path.join(__dirname, 'templates/' + syntax + ext);

      if (fs.existsSync(filename)) {
        return {
          filename,
          template: fs.readFileSync(filename, 'utf8')
        };
      } else if (!optional) {
        return grunt.fail.fatal('Cannot find template at path: ' + filename);
      }
    }
    /**
     * Render template with error reporting
     *
     * @param {Object} template {filename: 'Template filename', template: 'Template code'}
     * @param {Object} context Template context
     * @return {String}
     */


    function renderTemplate(template, context) {
      try {
        return _.template(template.template)(context);
      } catch (error) {
        grunt.fail.fatal('Error while rendering template ' + template.filename + ': ' + error.message);
      }
    }
    /**
     * Basic template function: replaces {variables}
     *
     * @param {Template} tmpl Template code
     * @param {Object} context Values object
     * @return {String}
     */


    function template(tmpl, context) {
      return tmpl.replace(/{([^}]+)}/g, (value, key) => context[key]);
    }
    /**
     * Prepare string to use as CSS class name
     *
     * @param {String} str
     * @return {String}
     */


    function classNameize(str) {
      return _.trim(str).replace(/\s+/g, '-');
    }
    /**
     * Return path of CSS file.
     *
     * @param {String} stylesheet (css, scss, ...)
     * @return {String}
     */


    function getCssFilePath(stylesheet) {
      const cssFilePrefix = option(wf.cssFilePrefixes, stylesheet);
      grunt.log.error(cssFilePrefix);
      return path.join(option(defaultOptions.destCssPaths, stylesheet), cssFilePrefix + defaultOptions.fontBaseName + '.' + stylesheet);
    }
    /**
     * Return path of HTML demo file or `null` if its generation was disabled.
     *
     * @return {String}
     */


    function getDemoFilePath() {
      if (!defaultOptions.htmlDemo) return null;
      const name = defaultOptions.htmlDemoFilename || defaultOptions.fontBaseName;
      return path.join(defaultOptions.destHtml, name + '.html');
    }
    /**
     * Return path of HTML demo file or `null` if feature was disabled
     *
     * @return {String}
     */


    function getDemoPath() {
      if (!defaultOptions.htmlDemo) return null;
      return defaultOptions.destHtml;
    }
    /**
     * Save hash to cache file.
     *
     * @param {String} name Task name (webfont).
     * @param {String} target Task target name.
     * @param {String} hash Hash.
     */


    function saveHash(name, target, hash) {
      const filepath = getHashPath(name, target);
      mkdirp.sync(path.dirname(filepath));
      fs.writeFileSync(filepath, hash);
    }
    /**
     * Read hash from cache file or `null` if file don’t exist.
     *
     * @param {String} name Task name (webfont).
     * @param {String} target Task target name.
     * @return {String|null}
     */


    function readHash(name, target) {
      const filepath = getHashPath(name, target);
      return fs.existsSync(filepath) ? fs.readFileSync(filepath, 'utf8') : null;
    }
    /**
     * Return path to cache file.
     *
     * @param {String} name Task name (webfont).
     * @param {String} target Task target name.
     * @return {String}
     */


    function getHashPath(name, target) {
      return path.join(defaultOptions.cache, name, target, 'hash');
    }
  });
};
