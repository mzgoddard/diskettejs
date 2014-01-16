var slice = [].slice;

var when = require( 'when' );

var events = require( './events' );
var load = require( './load' );

module.exports = Diskette;

function Diskette() {
  this._configPath = '';
  this._config = {};
  this._files = {};

  this._whenConfigDefer = when.defer();
  this._whenConfig = this._whenConfigDefer.promise;

  this._dbDefer = when.defer();
  this._dbPromise = this._dbDefer.promise;

  this._defer = when.defer();
  this.promise = this._defer.promise;
}

// Mixin events into Diskette.
events.mixin( Diskette.prototype );

// Other code may use Diskette's version of when ...
Diskette.when = when;

// Initialize the DB. Currently that means deleting it and creating a new one.
var _initDb = function() {
  var self = this;
  var req = indexedDB.deleteDatabase( '_diskette' );

  req.onsuccess = req.onerror = function() {
    var req = indexedDB.open( '_diskette', 1 );

    req.onupgradeneeded = function( e ) {
      var db = this.result;

      // reset for now
      if ( db.objectStoreNames.contains( self._configPath )) {
        db.deleteObjectStore( self._configPath );
      }

      db.createObjectStore( self._configPath, {
        autoIncrement: false
      });
    };

    req.onsuccess = function() {
      var db = this.result;
      db.close();
      self._dbDefer.resolve();
    };
    req.onerror = self._dbDefer.reject;
  };

  return self._dbPromise;
};

// Open a connection to the database.
var _getDb = function() {
  var defer = when.defer();
  var req = indexedDB.open( '_diskette', 1 );

  req.onsuccess = function() {
    var db = this.result;
    defer.resolve( db );
  };
  req.onerror = defer.reject;
  return defer.promise;
};

// Write a loaded block to the database.
var _writeBlock = function( file, data ) {
  var defer = when.defer();

  var self = this;
  // var request = indexedDB.open( '_diskette' );
  var db = null;
  _getDb.call( this ).then(function( _db ) {
    db = _db;

    var objectStore = db
      .transaction( self._configPath, 'readonly' )
      .objectStore( self._configPath );

    var request = objectStore.get( file.config.name || file.config );

    request.onsuccess = function() {
      var contents = this.result;

      var fileReader = new FileReader();
      fileReader.onloadend = function() {
        var objectStore = db
          .transaction( self._configPath, 'readwrite' )
          .objectStore( self._configPath );

        var request = objectStore.put(
          this.result,
          file.config.name || file.config
        );

        request.onsuccess = function() {
          defer.resolve();
        };
        request.onerror = defer.reject;
      };
      fileReader.onerror = defer.reject;

      fileReader.readAsArrayBuffer(
        new Blob( contents ? [ contents, data ] : [ data ])
      );
    };
    request.onerror = defer.reject;

    return defer.promise;
  }).otherwise( defer.reject )
    .ensure(function() {
      db.close();
    });

  return defer.promise;
};

// Read the contents of a file from a database.
var _readFile = function( file, type ) {
  var defer = when.defer();

  var self = this;
  var db = null;
  _getDb.call( this ).then(function( _db ) {
    db = _db;

    var objectStore = db
      .transaction( self._configPath, 'readonly' )
      .objectStore( self._configPath );
    var request = objectStore.get( file.name );

    request.onsuccess = function() {
      var contents = new Blob([ this.result ]);
      var fileReader = new FileReader();
      fileReader.onloadend = function() {
        defer.resolve( fileReader.result );
      };
      fileReader.onerror = defer.reject;

      if ( type === 'string' ) {
        fileReader.readAsText( contents );
      } else if ( type === 'url' ) {
        fileReader.readAsDataURL( contents );
      } else {
        fileReader.readAsArrayBuffer( contents );
      }
    };
    request.onerror = defer.reject;

    return defer.promise;
  }).otherwise( defer.reject )
    .ensure(function() {
      db.close();
    });

  return defer.promise;
};

// Read a file as a url from the database.
var _getUrl = function( file ) {
  return _readFile.call( this, file, 'url' );
};

// Grab a file's metadata from the diskette.
var _getFile = function( path ) {
  var file = this._files[ path ];
  if ( !file ) {
    file = this._files[ path ] = {
      config: { name: path },
      blocks: [],
      _complete: when.defer(),
      complete: null,
      _read: null,
      _url: null
    };
    file.complete = file._complete.promise;
  }

  return file;
};

// Is the file listed in the configuation.
var _isFileListed = function( path ) {
  if ( !this._config || !this._config.files ) {
    return false;
  }

  for ( var i = 0; i < this._config.files.length; ++i ) {
    var file = this._config.files[ i ];
    if ( ( file.name || file ) === path ) {
      return true;
    }
  }
  return false;
};

// Get the dirname of the config path.
var _getBaseUrl = function( path ) {
  return this._configPath
    .substring( 0, this._configPath.lastIndexOf( '/' ) + 1 );
};

// Return a promise for the loaded file. Either through block loading or loading
// the file straight from disk.
var _loadFile = function( name ) {
  var self = this;
  var baseUrl = _getBaseUrl.call( self );

  var file = _getFile.call( self, name );

  if ( !file._complete ) {
    return file.complete;
  }

  var complete = file._complete;
  file._complete = null;
  file.complete = load( baseUrl + name, 'binary' ).then(function( data ) {
    return _writeBlock.call( self, file, data )
      .yield( file.config )
      .then( complete.resolve, complete.reject, complete.notify );
  });

  return file.complete;
};

// Load the blocks for a config file and write their file sections to
// the database.
var _loadBlocks = function() {
  var allComplete = [];
  var baseUrl =
    this._configPath.substring( 0, this._configPath.lastIndexOf( '/' ) + 1 );

  var self = this;
  self._config.files.forEach(function( file ) {
    var filePromiseSet = _getFile.call( self, file.name || file );
    filePromiseSet.config =
      typeof file === 'string' ? { name: file } : file;

    if ( file.blocks ) {
      filePromiseSet.blocks =
        file.blocks.map(function() { return when.defer(); });

      filePromiseSet.complete = when.map(
        filePromiseSet.blocks,
        function( v ) {
          return v.promise;
        }
      ).yield( filePromiseSet.config );

      var complete = filePromiseSet._complete;
      filePromiseSet.complete
        .then( complete.resolve, complete.reject, complete.notify );
    } else {
      _loadFile.call( this, file.name || file );
    }

    allComplete.push( filePromiseSet.complete );
  }, self );

  if ( self._config.blocks ) {
    self._config.blocks.forEach(function( block ) {
      load( baseUrl + block.path, 'binary' ).then(function( data ) {
        block.ranges.forEach(function( range ) {
          var file = self._files[ range.filename ];
          var fileBlocks = file.blocks;
          var blockDefer = fileBlocks[ range.index ];

          when.all(
            fileBlocks.slice( 0, range.index )
              .map(function( v ) { return v.promise; })
          ).then(function( values ) {
            return _writeBlock.call(
              self, file, data.slice( range.start, range.end )
            );
          }).then( blockDefer.resolve, blockDefer.reject, blockDefer.notify );
        });
      });
    }, self );
  }

  return when.all( allComplete );
};

// Load files that have been requested but are not contained in the config.
var _loadUnlistedFiles = function() {
  var self = this;
  var baseUrl = _getBaseUrl.call( self );
  var promises = [];

  for ( var name in self._files ) {
    if ( !_isFileListed.call( self, name ) ) {
      promises.push( _loadFile.call( self, name ) );
    }
  }

  return when.all( promises );
};

// Point the Diskette to a configuration file.
Diskette.prototype.config = function( path ) {
  if ( this._configPath ) {
    throw new Error( 'Diskette configuration path already set.' );
  }

  var self = this;
  var defer = this._defer;
  self._configPath = path;

  when.all([
    _initDb.call( self ),
    load( path, 'string' )
  ]).then(function( values ) {
    var data = values[ 1 ];
    self._config = JSON.parse( data );
    self._whenConfigDefer.resolve( self._config );
    _loadUnlistedFiles.call( self );

    return self._dbPromise.then(function() {
      return _loadBlocks.call( self );
    });
  }).then( defer.resolve, defer.reject, defer.notify );
};

// Point the Diskette to a directory.
Diskette.prototype.fallback = function( path ) {
  if ( this._configPath ) {
    throw new Error( 'Diskette configuration path already set.' );
  }

  var self = this;
  var defer = this._defer;

  if ( path[ path.length - 1 ] !== '/' ) {
    path += '/';
  }
  self._configPath = path;

  _initDb.call( self )
    .then( defer.resolve, defer.reject, defer.notify )
    .then(function() {
      self._config = {};
      self._whenConfigDefer.resolve( self._config );
      _loadUnlistedFiles.call( self );
    });
};

// Read a file at path from the Diskette. Type can be string, array, or url.
Diskette.prototype.read = function( path, type ) {
  // We don't hold all contents, so read per request.
  var self = this;
  return self._whenConfig.then(function() {
    if ( !_isFileListed.call( self, path ) ) {
      // File is not listed, load normally.
      return _loadFile.call( self, path ).then(function() {
        return _getFile.call( self, path ).complete.then(function( file ) {
          return _readFile.call( self, file, type );
        });
      });
    } else {
      return _getFile.call( self, path ).complete.then(function( file ) {
        return _readFile.call( self, file, type );
      });
    }
  });
};

// Shortcut to read( path, 'url' ).
Diskette.prototype.url = function( path ) {
  return _getFile.call( self, path ).complete.then( _getUrl.bind( this ) );
};
