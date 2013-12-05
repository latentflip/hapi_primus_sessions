# Hapi Primus Sessions

A hapi and primus plugin which extends primus' spark with a `getSession(cb)` method which returns the current hapi session object.

## Why?

Typically primus binds to the same http server as hapi, but listens for it's own specific requests for setting up the websockets. These requests aren't routed through the hapi stack, so it won't have the session object added to the request object, which is needed if you want to check user session/auth information from within a primus connection/request.

This plugin extends both hapi and primus to allow you access to the session from within a primus request.



## Usage

Install it from npm: `npm install hapi_primus_sessions --save`.

Require in your hapi server pack as with any hapi plugin:


```javascript
var Hapi = require('hapi');
var server = new Hapi.Server('localhost', 3030);

var Primus = require('primus');
vae primus = new Primus(server.listener, { transformer: 'socket.io' });

server.pack.require({
    hapi_primus_sessions: { primus: primus, server: server }
},
function pluginsCallback (err) {
    if (err) throw err;
});

primus.on('connection', function (spark) {
    spark.getSession(function (err, session) {
        if (err) throw err;

        // You can now use the session object as if you were within hapi
        var user = session.user;
        var loggedIn = session._isAuthenticated(); //if using travelogue
        // ... etc
    });
});
```

The hapi plugin will register the primus half of the plugin with primus for you.


### Hapi Plugin options

The hapi plugin takes a number of options:

* `primus` [required] - a primus instance
* `server` [required] - the hapi server instance
* `debug` [optional, default=false] - whether to log debug messages
* `logger` [optional, default=console] - where to log debug messages, anything with a `log` method will work
* `routePath` [optional, default='/hapi-primus-sesssions/write-session'] - the internal route url created to share sessions. You should only need to change this if you want to use that "prime piece of real-estate" path within your own app.


### `spark.getSession(cb)`

A `getSession` method is added to every primus spark object. It accepts a callback with the signature: `function (err, session)`.

Session is the session object direct from hapi, so you can use it to auth/lookup the current user/etc as if you were within the hapi stack.


## How?

Don't ask.

Ok, really?

You sure?

Ok, fine. The spark object in primus is a partial request object, all it really has access to is the raw HTTP headers. But these are typically encrypted and decrypted deep in the bowels of hapi, so they aren't much use outside of the hapi stack.

Hapi doesn't expose any methods to retrieve a session, so we have to get funky. The plugin creates a fake http request and response object, which it emits from the http server that hapi is listening to, pointed at a custom route we inject into hapi. We add the encrypted headers from the primus spark to the request object, and a custom `writeSession` method to the response object which is scoped within the primus spark object.

Hapi happily takes the fake request, decodes the session information, and passes it all along to our custom hapi route handler, along with our fake response object. Our hapi handler then calls our custom `writeSession` method on the fake response object passing the session object, and `writeSession` passes it back into the scope of the spark.


## License

MIT


## Infrequently Asked Questions

* **Isn't there a better way to do this?** I hope so, but we haven't found it yet.
* **Is this stable?** Well, it works for me.
* **Can I contribute/suggest a better way of doing this?** Please do.
* **Are there tests?** If you can show me how to test this, there will be.

## Who

[Philip Roberts](http://twitter.com/philip_roberts) with much help from [Michael Garvin](http://twitter.com/wraithgar) and [Nathan LaFreniere](http://twitter.com/quitlahok). All [&yetis](http://twitter.com/andyet).


