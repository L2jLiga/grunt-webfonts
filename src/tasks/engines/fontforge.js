'use strict';

/**
 * grunt-webfont: fontforge engine
 *
 * @requires fontforge, ttfautohint 1.00+ (optional), eotlitetool.py
 * @author Artem Sapegin (http://sapegin.me)
 */

module.exports = function fontForgeEngine(o, allDone) {
  const [fs, path, temp, exec, chalk, _, wf] = [
    require('fs'),
    require('path'),
    require('temp'),
    require('child_process').exec,
    require('chalk'),
    require('lodash'),
    require('../util/util'),
  ];

  // Copy source files to temporary directory
  const tempDir = temp.mkdirSync();

  o.files.forEach((file) => {
    fs.writeFileSync(path.join(tempDir, o.rename(file)), fs.readFileSync(file));
  });

  // Run Fontforge
  const args = [
    'fontforge',
    '-script',
    '"' + path.join(__dirname, 'fontforge/generate.py') + '"',
  ].join(' ');

  const process = exec(args, {maxBuffer: o.execMaxBuffer}, (err, out) => {
    if (err instanceof Error && err.code === 127) {
      return fontforgeNotFound();
    } else if (err) {
      if (err instanceof Error) {
        return error(err.message);
      }

      // Skip some fontforge output such as copyrights. Show warnings only when no font files was created
      // or in verbose mode.
      const success = !!wf.generatedFontFiles(o);
      const notError = /(Copyright|License |with many parts BSD |Executable based on sources from|Library based on sources from|Based on source from git)/;
      const lines = err.split('\n');

      const warn = [];
      lines.forEach((line) => {
        if (!line.match(notError) && !success) {
          warn.push(line);
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
    } catch (err) {
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
  if (!process) return;

  process.stdin.on('error', (err) => {
    if (err.code === 'EPIPE') {
      fontforgeNotFound();
    }
  });

  process.on('exit', () => true);

  const params = _.extend(o, {
    inputDir: tempDir,
  });

  process.stdin.write(JSON.stringify(params));
  process.stdin.end();

  /**
   * Show error message
   * @return {Boolean}
   */
  function error() {
    allDone(false);
    return false;
  }

  /**
   * Show error message if fontForge not found
   * @return {void}
   */
  function fontforgeNotFound() {
    error('fontforge not found. Please install fontforge and all other requirements: ' + chalk.underline('https://github.com/sapegin/grunt-webfont#installation'));
  }
};
