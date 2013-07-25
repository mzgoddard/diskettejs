(function() {
  // Define for when for browsers.
  var diskette = {};
  var define = function(factory) {
    diskette.when = factory();
  };
  define.amd = {};
