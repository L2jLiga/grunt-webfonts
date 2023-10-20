/**
 * grunt-webfont: fontforge engine
 *
 * @requires fontforge, ttfautohint 1.00+ (optional), eotlitetool.py
 * @license
 * Copyright Andrey Chalkin <L2jLiga> and Artem Sapegin (http://sapegin.me). All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://github.com/L2jLiga/grunt-webfonts/LICENSE
 */

'use strict';
const fs = require('node:fs');
const path = require('node:path');
const temp = require('temp');
const exec = require('node:child_process').exec;
const chalk = require('chalk');
const wf = require('../util/util');

module.exports = function fontForgeEngine(options, allDone) {
  const logger = options.logger;

  // Copy source files to temporary directory
  const tempDir = temp.mkdirSync();

  options.files.forEach((file) => {
    fs.writeFileSync(path.join(tempDir, options.rename(file)), fs.readFileSync(file));
  });

  // Run Fontforge
  const args = [
    'fontforge',
    '-script',
    '"' + path.join(__dirname, 'fontforge/generate.py') + '"',
  ].join(' ');

  const proc = exec(args, {maxBuffer: options.execMaxBuffer}, (err, out) => {
    if (err instanceof Error && err.code === 127) {
      return fontforgeNotFound();
    } else if (err) {
      if (err instanceof Error) {
        return error(err.message);
      }

      // Skip some fontforge output such as copyrights. Show warnings only when no font files was created
      // or in verbose mode.
      const success = !!wf.generatedFontFiles(options);
      const notError = /(Copyright|License |with many parts BSD |Executable based on sources from|Library based on sources from|Based on source from git)/;
      const lines = err.split('\n');

      const warn = [];
      lines.forEach((line) => {
        if (!line.match(notError) && !success) {
          warn.push(line);
        } else {
          logger.verbose(chalk.grey('fontforge: ') + line);
        }
      });

      if (warn.length) {
        return error(warn.join('\n'));
      }
    }

    // Trim fontforge result
    const json = out.replace(/^[^{]+/, '').replace(/[^}]+$/, '');

    // Parse json
    let result;
    try {
      result = JSON.parse(json);
    } catch (errorMessage) {
      logger.verbose('Webfont did not receive a proper JSON result from Python script: ' + errorMessage);
      return error(
        'Something went wrong when running fontforge. Probably fontforge wasn’t installed correctly or one of your SVGs is too complicated for fontforge.\n\n' +
        '1. Try to run Grunt in verbose mode: ' + chalk.bold('grunt --verbose webfont') + ' and see what fontforge says. Then search GitHub issues for the solution: ' + chalk.underline('https://github.com/sapegin/grunt-webfont/issues') + '.\n\n' +
        '2. Try to use “node” engine instead of “fontforge”: ' + chalk.underline('https://github.com/sapegin/grunt-webfont#engine') + '\n\n' +
        '3. To find “bad” icon try to remove SVGs one by one until error disappears. Then try to simplify this SVG in Sketch, Illustrator, etc.\n\n',
      );
    }

    allDone({
      fontName: path.basename(result.file),
    });
  });

  // Send JSON with params
  if (!proc) return;
  proc.stdin.on('error', (err) => {
    if (err.code === 'EPIPE') {
      fontforgeNotFound();
    }
  });

  proc.stderr.on('data', (data) => {
    logger.verbose(data);
  });
  proc.stdout.on('data', (data) => {
    logger.verbose(data);
  });
  proc.on('exit', (code) => {
    if (code !== 0) {
      logger.log( // cannot use error() because it will stop execution of callback of exec (which shows error message)
        'fontforge process has unexpectedly closed.\n' +
        '1. Try to run grunt in verbose mode to see fontforge output: ' + chalk.bold('grunt --verbose webfont') + '.\n' +
        '2. If stderr maxBuffer exceeded try to increase ' + chalk.bold('execMaxBuffer') + ', see ' +
        chalk.underline('https://github.com/sapegin/grunt-webfont#execMaxBuffer') + '. ',
      );
    }
    return true;
  });

  const params = Object.assign({}, options, {
    inputDir: tempDir,
  });
  proc.stdin.write(JSON.stringify(params));
  proc.stdin.end();

  /**
   * Log error message
   * @param {*} args
   * @return {Boolean}
   */
  function error(...args) {
    logger.error.apply(null, ...args);
    allDone(false);
    return false;
  }

  /**
   * Show error message when fontForge not found
   * @return {void}
   */
  function fontforgeNotFound() {
    error('fontforge not found. Please install fontforge and all other requirements: ' + chalk.underline('https://github.com/sapegin/grunt-webfont#installation'));
  }
};
