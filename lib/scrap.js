// Helper function for multiple async param resolution:
{
  "xxx": "xxx",
  "bar": "fubar",
  "helper": function(chunk, context, bodies, params) {
    var values = {};
    function capture( id, next ) {
      return function( chunk ) {
        return chunk.capture( params[id], context, function( value, chunk ) {
          values[id] = value;
          next( chunk ).end();
        });
      };
    }
    var fn = function( chunk ) {
      for( var id in values ) chunk.write( values[id] );
      return chunk;
    }
    for( var id in params ) {
      fn = capture( id, fn );
    }
    fn( chunk );
    /* Above replicates the following:
    return chunk.capture(params.foo, context, function(value, chunk) {
      chunk.capture(params.foo2, context, function(value2, chunk) {
        chunk.write(value).write(value2).end();
      }).end();
    });
    */
  }
}

// Capture all parameter values, pass result values to the callback.
function captureParams(chunk, context, params, cb) {
    var values = {};
    function capture( id, next ) {
      return function( chunk ) {
        if( typeof params[id] == 'function' ) {
          return chunk.capture( params[id], context, function( value, chunk ) {
            values[id] = value;
            next( chunk ).end();
          });
        }
        else {
          return chunk.map(function( chunk ) {
            values[id] = params[id];
            next( chunk ).end();
          });
        }
      };
    }
    var fn = function( chunk ) {
      process.nextTick(function() {
          cb( values );
      });
      return chunk;
    }
    for( var id in params ) {
      fn = capture( id, fn );
    }
    fn( chunk );
}
