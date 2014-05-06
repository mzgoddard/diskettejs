var when = require( 'when' );

module.exports = DisketteStoreFile;

function DisketteStoreFile() {
  this._defer = when.defer();
  this.promise = this._defer.promise;
}

DisketteStoreFile.prototype.init = function() {};
DisketteStoreFile.prototype.setMeta = function() {};
DisketteStoreFile.prototype.getMeta = function() {};
DisketteStoreFile.prototype.append = function( data ) {};
DisketteStoreFile.prototype.read = function() {};
