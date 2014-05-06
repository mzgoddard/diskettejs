var when = require( 'when' );

module.exports = DisketteBlockRange;

function DisketteBlockRange( blockPromise, start, end ) {
  this._blockPromise = blockPromise;
  this.start = start;
  this.end = end;

  this.promise = when.promise(
    blockPromise
      .then(function( data ) {
        return data.slice( self.start, self.end );
      })
      .then
  );
}
