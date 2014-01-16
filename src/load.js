var DisketteLoad;
if ( typeof window !== 'undefined' ) {
  DisketteLoad = require( './load.xhr' );
} else {
  DisketteLoad = require( './load.node' );
}

var instance = DisketteLoad.getInstance();
module.exports = instance.load.bind( instance );
