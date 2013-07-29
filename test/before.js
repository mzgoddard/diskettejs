#!/usr/bin/env node

var exec = require( 'child_process' ).exec;
var path = require( 'path' );

var when = require( 'when' );
var whenNodefn = require( 'when/node/function' );
var whenParallel = require( 'when/parallel' );

var whenExec = whenNodefn.lift( exec );

var convertTests = function( name ) {
  return whenExec(
    path.normalize( __dirname + '/../bin/convert' ) + ' ' +
      ( [
        '-c', path.join( __dirname, name, 'data', 'diskette.json' ),
        '-I', path.join( __dirname, name, 'data' ),
        '-O', path.join( __dirname, name, 'dist' )
      ].join( ' ' ) ) );
};

(function() {
  whenParallel([
    convertTests.bind( null, 'convert1' ),
    convertTests.bind( null, 'convert2' )
  ]).otherwise(function( e ) {
    console.error( e.stack || e );
  });
}());
