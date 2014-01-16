var Diskette = require( './src/diskette' );
module.exports = Diskette;

if ( typeof window !== 'undefined' ) {
  window.Diskette = Diskette;
}
