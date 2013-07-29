'use strict';

module.exports = function(grunt) {
  grunt.initConfig({
    jshint: {
      options: {
        node: true,
        browser: true
      },

      lib: {
        files: {
          src: 'diskette.js'
        }
      },

      node: {
        files: {
          src: [ 'src/main.js', 'bin/convert' ]
        }
      },

      test: {
        options: {
          globals: {
            after: true,
            afterEach: true,
            before: true,
            beforeEach: true,
            chai: true,
            suite: true,
            test: true
          }
        },

        files: {
          src: 'test/*.js'
        }
      }
    },

    concat: {
      diskette: {
        files: {
          'dist/diskette.js': [
            'iife/head.js',
            'node_modules/when/when.js',
            'diskette.js',
            'iife/tail.js'
          ]
        },
        separator: ';'
      }
    },

    uglify: {
      diskette: {
        files: {
          'dist/diskette.min.js': [
            'dist/diskette.js'
          ]
        }
      }
    },

    testem: {
      options: {
        launch_in_ci: [ 'firefox', 'chrome' ]
      },
      diskette: {
        src: 'testem.json'
      }
    }

  });

  grunt.loadNpmTasks( 'grunt-contrib-concat' );
  grunt.loadNpmTasks( 'grunt-contrib-uglify' );
  grunt.loadNpmTasks( 'grunt-contrib-jshint' );
  grunt.loadNpmTasks( 'grunt-testem' );

  grunt.registerTask( 'test', [ 'jshint', 'testem' ]);

  grunt.registerTask( 'debug', [ 'concat' ]);

  grunt.registerTask( 'release', [ 'debug', 'uglify' ]);

  grunt.registerTask( 'default', [ 'debug' ]);
};
