var when = require( 'when' );

var DisketteStoreFile = require( 'storefile' );

function DisketteStoreFileIDB( path, store ) {
  DisketteStoreFile.call( this );

  this.path = path;
  this._store = store;
}

DisketteStoreFileIDB.prototype = Object.create( DisketteStoreFile.prototype );
DisketteStoreFileIDB.prototype.constructor = DisketteStoreFileIDB;

DisketteStoreFileIDB.prototype.init = function() {};

DisketteStoreFileIDB.prototype.setMeta = function() {};

DisketteStoreFileIDB.prototype.getMeta = function() {};

DisketteStoreFileIDB.prototype.append = function( data ) {
  var self = this;
  this.store._objectStore().then(function( objectStore ) {
    var defer = when.defer();
    var request = objectStore.get( self.path );

    request.onsuccess = function() {
      var contents = this.result;

      var fileReader = new FileReader();
      fileReader.onloadend = function() {
        var newContents = this.result;
        self.store._objectStore().then(function( objectStore ) {
          var request = objectStore.put( newContents, self.path );

          request.onsuccess = function() {
            defer.resolve();
          };
          request.onerror = defer.reject;
        });
      };
      fileReader.onerror = defer.reject;

      // Use fileReader to append old contents and new data.
      fileReader.readAsArrayBuffer(
        new Blob( contents ? [ contents, data ] : [ data ])
      );
    };
    request.onerror = defer.reject;

    return defer.promise;
  });
};

DisketteStoreFileIDB.prototype.read = function() {
  
};
