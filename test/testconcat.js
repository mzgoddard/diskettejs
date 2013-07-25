(function() {
  var assert, diskette;
  if ( typeof window !== 'undefined' ) {
    assert = chai.assert;
    diskette = window.diskette;
  } else {
    assert = require( 'chai' ).assert;
    diskette = require( '../index' );
  }

  suite( 'concat' );

  test( 'complete', function( done ) {
    assert.ok( Diskette );

    var c = new Diskette();
    c.config( 'concat/config.json' );
    c.promise.yield( undefined ).then( done, done );
  });

  test( 'file check', function( done ) {
    assert.ok( Diskette );

    var c = new Diskette();
    c.config( 'concat/config.json' );
    c.promise.otherwise( done );
    c.read( 'doublealphabet.txt', 'string' ).then(function( value ) {
      assert.equal(
        value,
        'abcdefghijklmnopqrstuvwxyzabcdefghijklmnopqrstuvwxyz'
      );
    }).then( done, done );
  });
}());
