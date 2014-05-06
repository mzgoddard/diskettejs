module.exports = DisketteRangeHandler;

function forwardIfSameLength( array, defer ) {
  var length = array.length;
  when.all( array
    .then(function( v ) {
      if ( length === array.length ) {
        defer.resolve( v );
      }
    }, function( e ) {
      if ( length === array.length ) {
        defer.reject( e );
      }
    }, function( n ) {
      if ( length === array.length ) {
        defer.notify( n );
      }
    });
}

function DisketteRangeHandler( storeFile, blockRanges ) {
  this._storeFile = storeFile;
  this.ranges = ranges || [];

  this._defer = when.defer();
  this.promise = this._defer.promise;

  this._handlePromises = [];
  this._lastHandlePromise = when( true );
  this.ranges.forEach( this._handleRange, this );

  // Forward status of all ranges if the number of ranges is correct.
  forwardIfSameLength( this._handlePromises, this._defer );
}

DisketteRangeHandler.prototype._handleRange = function( blockRange ) {
  this._lastHandlePromise = this._lastHandlePromise
    .yield( blockRange.promise )
    .then( this._storeFile.append.bind( this._storeFile ) );
  this._handlePromises.push( this._lastHandlePromise );
};

DisketteRangeHandler.prototype.addRange = function( blockRange ) {
  this.ranges.push( blockRange );
  this._handleRange( blockRange );

  // Forward status of all ranges if the number of ranges is correct.
  forwardIfSameLength( this._handlePromises, this._defer );
};
