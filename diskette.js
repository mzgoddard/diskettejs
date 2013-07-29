(function( fn ) {
  window.Diskette = fn(
    typeof diskette !== 'undefined' ? diskette : { when: window.when }
  );
}(function( diskette ) {
  var slice = [].slice;

  var when;
  (function() {
    if ( typeof window === 'undefined' ) {
      when = require( 'when' );
    } else {
      when = diskette.when;
    }
  }());

  var load = (function() {
    if ( typeof window === 'undefined' ) {
      var fs = require( 'fs' );
      var nodefn = require( 'when/node/function' );

      return nodefn.lift(function( path, cb ) {
        fs.readFile( path, 'utf8', cb );
      });
    } else {
      return function( path, responseType ) {
        var defer = when.defer();

        var xhr = new XMLHttpRequest();
        xhr.open( 'GET', path );
        xhr.responseType = responseType === 'string' ? '' : 'blob';
        xhr.onload = function( e ) {
          defer.resolve( xhr.response );
        };
        xhr.onerror = function( e ) {
          defer.reject( e );
        };
        xhr.send();

        return defer.promise;
      };
    }
  }());

  function Diskette() {
    this._configPath = '';
    this._config = {};
    this._files = {};

    this._dbDefer = when.defer();
    this._dbPromise = this._dbDefer.promise;

    this._defer = when.defer();
    this.promise = this._defer.promise;
  }

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
        self._dbDefer.resolve();
        db.close();
      };
      req.onerror = self._dbDefer.reject;
    };

    return self._dbPromise;
  };

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
      var request = objectStore.get( file.config.name );

      request.onsuccess = function() {
        var contents = this.result;

        var fileReader = new FileReader();
        fileReader.onloadend = function() {
          var objectStore = db
            .transaction( self._configPath, 'readwrite' )
            .objectStore( self._configPath );

          var request = objectStore.put(
            this.result,
            file.config.name
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

  var _getUrl = function( file ) {
    return _readFile.call( this, file, 'url' );
  };

  var _getFile = function( path ) {
    var file = this._files[ path ];
    if ( !file ) {
      file = this._files[ path ] = {
        config: {},
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

  var _loadBlocks = function() {
    var allComplete = [];
    var baseUrl =
      this._configPath.substring( 0, this._configPath.lastIndexOf( '/' ) + 1 );

    this._config.files.forEach(function( file ) {
      var filePromiseSet = _getFile.call( this, file.name );
      filePromiseSet.config = file;
      filePromiseSet.blocks =
        file.blocks.map(function() { return when.defer(); });

      var complete = filePromiseSet._complete;
      filePromiseSet.complete = when.map( filePromiseSet.blocks, function( v ) {
        return v.promise;
      }).yield( filePromiseSet.config )
        .then( complete.resolve, complete.reject, complete.notify );
      allComplete.push( filePromiseSet.complete );
    }, this );

    var self = this;
    this._config.blocks.forEach(function( block ) {
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
    }, this );

    return when.all( allComplete );
  };

  Diskette.prototype.config = function( path ) {
    var self = this;
    var defer = this._defer;
    self._configPath = path;
    _initDb.call( self );
    load( path, 'string' ).then(function( data ) {
      self._config = JSON.parse( data );
      return self._dbPromise.then(function() {
        return _loadBlocks.call( self );
      });
    }).then( defer.resolve, defer.reject, defer.notify );
  };

  Diskette.prototype.read = function( path, type ) {
    // We don't hold all contents, so read per request.
    var self = this;
    return _getFile.call( self, path ).complete.then(function( file ) {
      return _readFile.call( self, file, type );
    });
  };

  Diskette.prototype.url = function( path ) {
    return _getFile.call( self, path ).complete.then( _getUrl.bind( this ) );
  };

  Diskette.prototype.on = function( evt, fn, ctx ) {
    if ( !this._events ) { this._events = []; }
    var _events = this._events;
    _events[ evt ] = _events[evt] || [];
    _events[ evt ].push( fn, ctx );
  };

  Diskette.prototype.off = function( evt, fn, ctx ) {
    if ( !this._events ) { return; }

    var i;
    var _events = this._events;
    var eventList;
    if ( evt ) {
      eventList = _events[ evt ];
      if ( fn ) {
        for (
          i = eventList.indexOf( fn );
          !!~i;
          i = eventList.indexOf( fn, i + 1 )
        ) {
          if ( eventList[ i + 1 ] === ctx || !ctx ) {
            eventList.splice( i, 2 );
          }
        }
      } else if ( ctx ) {
        for (
          i = eventList.indexOf( ctx );
          !!~i;
          i = eventList.indexOf( ctx, i + 1 )
        ) {
          eventList.splice( i - 1, 2 );
        }
      }
    } else if ( ctx ) {
      for ( evt in _events ) {
        eventList = _events[ evt ];
        for (
          i = eventList.indexOf( ctx );
          !!~i;
          i = eventList.indexOf( ctx, i + 1 )
        ) {
          eventList.splice( i - 1, 2 );
        }
      }
    }
  };

  Diskette.prototype.trigger = function( evt, args ) {
    if ( !this._events ) { return; }
    var eventList = this._events[ evt ];
    args = slice.call( arguments, 1 );
    for ( var i = 0; i < eventList; i += 2 ) {
      eventList[ i ].apply( eventList[ i + 1 ] || this, args );
    }
  };

  Diskette.when = when;

  return Diskette;
}));
