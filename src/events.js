var Events = {};
module.exports = Events;

Events.on = function( evt, fn, ctx ) {
  if ( !this._events ) { this._events = []; }
  var _events = this._events;
  _events[ evt ] = _events[evt] || [];
  _events[ evt ].push( fn, ctx );
};

Events.off = function( evt, fn, ctx ) {
  if ( !this._events ) { return; }

  var i;
  var _events = this._events;
  var eventList;
  if ( evt ) {
    eventList = _events[ evt ];
    if ( fn ) {
      for (
        i = eventList.indexOf( fn );
        !!~i;
        i = eventList.indexOf( fn, i + 1 )
      ) {
        if ( eventList[ i + 1 ] === ctx || !ctx ) {
          eventList.splice( i, 2 );
        }
      }
    } else if ( ctx ) {
      for (
        i = eventList.indexOf( ctx );
        !!~i;
        i = eventList.indexOf( ctx, i + 1 )
      ) {
        eventList.splice( i - 1, 2 );
      }
    }
  } else if ( ctx ) {
    for ( evt in _events ) {
      eventList = _events[ evt ];
      for (
        i = eventList.indexOf( ctx );
        !!~i;
        i = eventList.indexOf( ctx, i + 1 )
      ) {
        eventList.splice( i - 1, 2 );
      }
    }
  }
};

Events.trigger = function( evt, args ) {
  if ( !this._events ) { return; }
  var eventList = this._events[ evt ];
  args = slice.call( arguments, 1 );
  for ( var i = 0; i < eventList; i += 2 ) {
    eventList[ i ].apply( eventList[ i + 1 ] || this, args );
  }
};

Events.mixin = function( prototype ) {
  prototype.on = this.on;
  prototype.off = this.off;
  prototype.trigger = this.trigger;
  return prototype;
};
