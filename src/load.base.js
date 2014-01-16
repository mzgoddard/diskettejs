module.exports = DisketteLoad;

function DisketteLoad() {
  this.promiseMap = {};
}

DisketteLoad.prototype._load = function( path, type ) {
  throw new Error( 'DisketteLoad._load not implemented.' );
};

DisketteLoad.prototype.load = function( path, type ) {
  var promiseMap = this.promiseMap;

  if ( !promiseMap[ path ] ) {
    var promise = this._load( path, type );
    promise.always(function() {
      delete promiseMap[ path ];
    });
    promiseMap[ path ] = promise;
  }

  return promiseMap[ path ];
};

DisketteLoad._subclass = null;

DisketteLoad.getInstance = (function() {
  var _instance;

  return function() {
    if ( !_instance ) {
      _instance = new DisketteLoad._subclass();
    }
    return _instance;
  };
}());
