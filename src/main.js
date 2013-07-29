//

var fs = require( 'fs' );
var path = require( 'path' );

var _ = require( 'lodash' );
var crc32 = require( 'crc32' );
var pipeline = require( 'when/pipeline' );
var when = require( 'when' );
var whenCb = require( 'when/callbacks' );
var whenGuard = require( 'when/guard' );
var whenNodefn = require( 'when/node/function' );

var whenFs = {
  exists: whenCb.lift( fs.exists ),
  mkdir: whenNodefn.lift( fs.mkdir ),
  readFile: whenNodefn.lift( fs.readFile ),
  stat: whenNodefn.lift( fs.stat ),
  writeFile: whenNodefn.lift( fs.writeFile )
};

function Application( config, options ) {
  this.config = config;
  this.options = _.defaults( options, {
    inputDirectory: 'data',
    outputDirectory: 'dist/data',
    metadataPath: 'diskette.json',
    bufferSize: 0xfffff
  } );
  this.metadata = { files: [], blocks: [] };
}

Application.prototype.addFile = function( name ) {
  var file;
  this.metadata.files.push( file = {
    name: name,
    size: 0,
    lastModified: 0,
    crc32: '',
    blocks: []
  } );

  var fullpath = path.join( this.options.inputDirectory, name );

  return whenFs
    .stat( fullpath )
    .then( function( stat ) {
      file.size = stat.size;
      file.lastModified = stat.mtime.getTime();
    } )
    .yield( whenFs.readFile( fullpath ) )
    .then( function( buffer ) {
      file.crc32 = crc32( buffer );
      return buffer;
    } );
};

Application.prototype.addFileRange = function( name, rangeData ) {
  var file = _.find( this.metadata.files, function( file ) {
    return file.name === name;
  } );

  // Not yet sure what info is useful to include.
  file.blocks.push( {} );
};

Application.prototype.filesList = function() {
  return this.config.files.map( function( file ) {
    if ( typeof file === 'string' ) {
      return file;
    } else {
      return file.name;
    }
  } );
};

Application.prototype.addBlock = function( info, buffer ) {
  this.metadata.blocks.push( info );
  return whenFs.writeFile(
    path.join( this.options.outputDirectory, info.path ),
    buffer
  );
};

Application.prototype.writeMetadata = function() {
  return whenFs.writeFile(
    path.join( this.options.outputDirectory, this.options.metadataPath ),
    JSON.stringify( this.metadata )
  );
};

Application.prototype.getMetadata = function() {
  return this.metadata;
};

module.exports = function main( options ) {
  console.log( 'Main.' );
  return pipeline( [
    //
    // Load config file.
    //
    function( options ) {
      console.log( 'Step 1.' );
      var config = options.config;
      delete options.config;

      var whenConfig;
      if ( typeof config === 'string' ) {
        whenConfig = whenFs
          .readFile( config, 'utf8' )
          .then( JSON.parse );
      } else {
        whenConfig = when( config );
      }

      return whenConfig.then( function( config ) {
        console.log( 'Loaded config. %d files.', config.files.length );
        return new Application( config, _.defaults( options, config.options ) );
      } );
    },

    //
    // Confirm folder structure is ready.
    //
    function( app ) {
      return (function recurseMkdir( dir ) {
        return whenFs.exists( dir ).then(function( exists ) {
          if ( !exists ) {
            return recurseMkdir( path.dirname( dir ) )
              .then( whenFs.mkdir.bind( null, dir ) );
          } else {
            return true;
          }
        });
      }( app.options.outputDirectory )).yield( app );
    },

    //
    // Load and concatenate files into blocks.
    //
    function( app ) {
      console.log( 'Step 2.' );
      var blockIndex = 0;
      var blockBuffer = new Buffer( app.options.bufferSize );
      var blockData = { path: 'data' + blockIndex, ranges: [] };

      return when.map(
        app.filesList(),
        whenGuard( whenGuard.n( 1 ), function( filename ) {
          return app.addFile( filename )
            .then( function( filebuffer ) {
              console.log( 'Read %s. File size: %d.', filename, filebuffer.length );

              var lastRange = _.last( blockData.ranges ) || { end: 0 };
              var rangeStart = 0;
              var rangeEnd = 0;
              var rangeIndex = 0;

              var whenBlocks = [];

              while (
                filebuffer.length - rangeEnd > 0
              ) {
                rangeEnd = Math.min(
                  rangeStart + app.options.bufferSize - lastRange.end,
                  filebuffer.length
                );

                filebuffer.copy(
                  blockBuffer,
                  lastRange.end,
                  rangeStart,
                  rangeEnd
                );

                blockData.ranges.push( lastRange = {
                  filename: filename,
                  index: rangeIndex++,
                  start: lastRange.end,
                  end: lastRange.end + rangeEnd - rangeStart
                } );
                app.addFileRange( filename, lastRange );

                rangeStart = rangeEnd;

                if ( lastRange.end === app.options.bufferSize ) {
                  whenBlocks.push( app.addBlock( blockData, blockBuffer ) );
                  blockBuffer = new Buffer( app.options.bufferSize );
                  blockData = { path: 'data' + ( ++blockIndex ), ranges: [] };
                  lastRange = _.last( blockData.ranges ) || { end: 0 };
                }
              }

              return when.all( whenBlocks );
            } );
        } )
      ).then( function() {
        // Write out the last block.
        if ( blockData.ranges.length ) {
          return app.addBlock( blockData, blockBuffer.slice(
            0,
            _.last( blockData.ranges ).end
          ) )
            .then( function() {
              console.log( 'Wrote block %d.', blockIndex );
            } );
        }
      } ).yield( app );
    },

    //
    // Write metadata file.
    //
    function( app ) {
      console.log( 'Step 3.' );
      return app.writeMetadata();
    }
  ], options ).otherwise( function( e ) {
    console.error( e.stack || e );
  } );
};
