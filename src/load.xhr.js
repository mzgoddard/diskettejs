var when = require( 'when' );

var DisketteLoadBase = require( './load.base' );

module.exports = DisketteLoadXhr;

function DisketteLoadXhr() {
  this.promiseMap = {};
}

DisketteLoadXhr.prototype = Object.create( DisketteLoadBase.prototype );
DisketteLoadXhr.prototype.constructor = DisketteLoadXhr;

DisketteLoadXhr.prototype._load = function( path, responseType ) {
  var defer = when.defer();

  var xhr = new XMLHttpRequest();
  xhr.open( 'GET', path );
  xhr.responseType = responseType === 'string' ? '' : 'blob';
  xhr.onload = function( e ) {
    if ( xhr.status >= 400 ) {
      defer.reject( new Error( 'Server returned an error.' ) );
    } else {
      defer.resolve( xhr.response );
    }
  };
  xhr.onerror = function( e ) {
    defer.reject( e );
  };
  xhr.send();

  return defer.promise;
};

DisketteLoadXhr.getInstance = DisketteLoadBase.getInstance;

DisketteLoadBase._subclass = DisketteLoadXhr;
