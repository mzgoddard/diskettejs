(function() {
  var assert, Diskette;
  if ( typeof window !== 'undefined' ) {
    assert = chai.assert;
    Diskette = window.Diskette;
  } else {
    assert = require( 'chai' ).assert;
    Diskette = require( '../diskette' );
  }

  suite( 'fallback' );

  var confirmPiJson = function( value ) {
    value = new Uint8Array( value );
    assert.equal( value.length, 128 );
    assert.equal( crc32( value ), 'bc026184' );
  };

  var confirmTowerJpg = function( value ) {
    value = new Uint8Array( value );
    assert.equal( value.length, 49058 );
    assert.equal( crc32( value ), 'f7f2381a', 'check tower.jpg hash' );
  };

  test( 'resolve immediately when fallback is used', function( done ) {
    var c = new Diskette();
    c.fallback( '' );
    c.promise.yield( undefined ).then( done, done );
  });

  test( 'load config json instead of metadata json', function( done ) {
    var c = new Diskette();
    // The primary difference of a config file and metadata is metadata will
    // include block information.
    c.config( 'convert1/data/diskette.json' );
    c.promise.yield( undefined ).then( done, done );
  });

  test( 'load files included in config json', function( done ) {
    var c = new Diskette();
    c.read( 'pi.json', 'binary' )
      .then( confirmPiJson )
      .then( done, done );

    // You can set the config file after reads are requested.
    c.config( 'convert1/data/diskette.json' );
    c.promise.otherwise( done );
  });

  test( 'load files not included in config json', function( done ) {
    var c = new Diskette();
    c.read( '../../convert2/data/tower.jpg', 'binary' )
      .then( confirmTowerJpg )
      .then( done, done );

    c.config( 'convert1/data/diskette.json' );
    c.promise.otherwise( done );
  });

  test( 'load files without a config at all', function( done ) {
    var c = new Diskette();
    c.read( 'tower.jpg', 'binary' )
      .then( confirmTowerJpg )
      .then( done, done );

    c.fallback( 'convert2/data' );
    c.promise.otherwise( done );
  });

  test( 'load files after a fallback url is set', function( done ) {
    var c = new Diskette();
    c.fallback( 'convert2/data' );
    c.promise.then(function() {
      c.read( 'tower.jpg', 'binary' )
        .then( confirmTowerJpg )
        .then( done, done );
    }).otherwise( done );
  });

  test( 'loading a config and fallback is an error', function() {
    var c = new Diskette();
    c.config( 'convert1/data/diskette.json' );
    assert.throws(function() {
      c.fallback( 'convert1/data' );
    });
  });
}());
