'use strict';

module.exports = function Gruntfile(grunt) {
  grunt.loadNpmTasks('grunt-babel');
  grunt.loadNpmTasks('grunt-eslint');

  grunt.initConfig({
    babel: {
      dist: {
        files: [{
          expand: true,
          src: '**/*.js',
          dest: './',
          cwd: 'src',
        }],
      },
    },

    eslint: {
      target: ['./src/**/*.js'],
    },
  });

  grunt.registerTask('build', ['eslint', 'babel']);
};
