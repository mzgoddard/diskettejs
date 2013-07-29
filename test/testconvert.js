(function() {
  var assert, diskette;
  if ( typeof window !== 'undefined' ) {
    assert = chai.assert;
    diskette = window.diskette;
  } else {
    assert = require( 'chai' ).assert;
    diskette = require( '../index' );
  }

  suite( 'convert' );

  test( 'load single file', function( done ) {
    assert.ok( Diskette );

    var c = new Diskette();
    c.config( 'convert1/dist/diskette.json' );
    c.promise.yield( undefined ).then( done, done );
  });

  test( 'file check single file', function( done ) {
    assert.ok( Diskette );

    var c = new Diskette();
    c.read( 'pi.json', 'binary' ).then(function( value ) {
      value = new Uint8Array( value );
      assert.equal( value.length, 128 );
      assert.equal( (crc32.table( value )>>>0).toString(16), 'bc026184' );
    }).then( done, done );

    // You can set the config file after reads are requested.
    c.config( 'convert1/dist/diskette.json' );
    c.promise.otherwise( done );
  });

  test( 'load two files', function( done ) {
    assert.ok( Diskette );

    var c = new Diskette();
    c.config( 'convert2/dist/diskette.json' );
    c.promise.yield( undefined ).then( done, done );
  });

  test( 'file check two files', function( done ) {
    assert.ok( Diskette );

    var c = new Diskette();
    Diskette.when()
      .then(function() {
        return c.read( 'tower.jpg', 'binary' ).then(function( value ) {
          value = new Uint8Array( value );
          assert.equal( value.length, 49058 );
          assert.equal( crc32( value ), 'f7f2381a', 'check tower.jpg hash' );
        });
      })
      .then(function() {
        return c.read( 'wallart.jpg', 'binary' ).then(function( value ) {
          value = new Uint8Array( value );
          assert.equal( value.length, 35180 );
          assert.equal( crc32( value ), '2cdfe6b2', 'check wallart.jpg hash' );
        });
      }).yield( undefined ).then( done, done );

    // You can set the config file after reads are requested.
    c.config( 'convert2/dist/diskette.json' );
    c.promise.otherwise( done );
  });
}());
