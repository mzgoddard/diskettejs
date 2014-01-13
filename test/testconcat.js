(function() {
  var assert, Diskette;
  if ( typeof window !== 'undefined' ) {
    assert = chai.assert;
    Diskette = window.Diskette;
  } else {
    assert = require( 'chai' ).assert;
    Diskette = require( '../diskette' );
  }

  suite( 'concat' );

  test( 'load', function( done ) {
    assert.ok( Diskette );

    var c = new Diskette();
    c.config( 'concat/config.json' );
    c.promise.yield( undefined ).then( done, done );
  });

  test( 'file check', function( done ) {
    assert.ok( Diskette );

    var c = new Diskette();
    c.read( 'doublealphabet.txt', 'string' ).then(function( value ) {
      assert.equal(
        value,
        'abcdefghijklmnopqrstuvwxyzabcdefghijklmnopqrstuvwxyz'
      );
    }).then( done, done );

    // You can set the config file after reads are requested.
    c.config( 'concat/config.json' );
    c.promise.otherwise( done );
  });
}());
