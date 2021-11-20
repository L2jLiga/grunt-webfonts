/**
 * @license
 * Copyright Andrey Chalkin <L2jLiga> and Artem Sapegin (http://sapegin.me). All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://github.com/L2jLiga/grunt-webfonts/LICENSE
 */

'use strict';

module.exports = function Gruntfile(grunt) {
  grunt.loadNpmTasks('grunt-eslint');

  grunt.initConfig({
    eslint: {
      target: ['./tasks/**/*.js'],
    },
  });

  grunt.registerTask('build', ['eslint']);
};
