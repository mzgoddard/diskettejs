#!/usr/bin/env node

var fs = require( 'fs' );
var path = require( 'path' );

var when = require( 'when' );
var whenCb = require( 'when/callbacks' );
var whenNodefn = require( 'when/node/function' );
var whenParallel = require( 'when/parallel' );

var whenFs = {
  exists: whenCb.lift( fs.exists ),
  unlink: whenNodefn.lift( fs.unlink ),
  readdir: whenNodefn.lift( fs.readdir ),
  rmdir: whenNodefn.lift( fs.rmdir ),
  stat: whenNodefn.lift( fs.stat )
};

var recurseRmdir = function( dir ) {
  return whenFs
    .exists( dir )
    .then(function( exists ) {
      if ( exists ) {
        return whenFs
          .stat( dir )
          .then(function( stat ) {
            if ( stat.isDirectory() ) {
              return whenFs
                .readdir( dir )
                .then(function( files ) {
                  return when.map(
                    files,
                    function( file ) {
                      return recurseRmdir( path.join( dir, file ) );
                    });
                })
                .then(function() {
                  return whenFs.rmdir( dir );
                });
            } else {
              return whenFs.unlink( dir );
            }
          });
      }
    });
};

(function() {
  return whenParallel([
    recurseRmdir.bind( null, path.join( __dirname, 'convert1/dist' ) ),
    recurseRmdir.bind( null, path.join( __dirname, 'convert2/dist' ) )
  ]).otherwise(function( e ) {
    console.error( e.stack || e );
  });
}());
