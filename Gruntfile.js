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
          src: [ 'index.js', 'src/*.js' ]
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

    uglify: {
      diskette: {
        src: 'dist/diskette.js',
        dest: 'dist/diskette.min.js'
      }
    },

    testem: {
      options: {
        launch_in_ci: [ 'firefox', 'chrome' ]
      },
      diskette: {
        src: 'testem.json'
      }
    },

    webpack: {
      diskette: {
        entry: './index.js',
        output: {
          path: 'dist/',
          filename: 'diskette.js',
          sourceMapFilename: '[file].map',
          pathInfo: true
        },

        devtool: 'source-map'
      }
    }

  });

  grunt.loadNpmTasks( 'grunt-contrib-uglify' );
  grunt.loadNpmTasks( 'grunt-contrib-jshint' );
  grunt.loadNpmTasks( 'grunt-testem' );
  grunt.loadNpmTasks( 'grunt-webpack' );

  grunt.registerTask( 'test', [ 'jshint', 'testem' ]);

  grunt.registerTask( 'debug', [ 'webpack' ]);

  grunt.registerTask( 'release', [ 'debug', 'uglify' ]);

  grunt.registerTask( 'default', [ 'debug' ]);
};
