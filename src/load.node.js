var fs = require( 'fs' );
var nodefn = require( 'when/node/function' );

var DisketteLoadBase = require( './load.base' );

module.exports = DisketteLoadNode;

function DisketteLoadNode() {
  this.promiseMap = {};
}

DisketteLoadNode.prototype = Object.create( DisketteLoadBase.prototype );
DisketteLoadNode.prototype.constructor = DisketteLoadNode;

DisketteLoadNode.prototype.__load = nodefn.lift(function( path, cb ) {
  fs.readFile( path, 'utf8', cb );
});

DisketteLoadNode.prototype._load = function( path, type ) {
  return this.__load( path, type );
};

DisketteLoadBase._subclass = DisketteLoadNode;
DisketteLoadNode.getInstance = DisketteLoadBase.getInstance;
