/*
 * Adds a getSession method to Primus's Spark object
 * which retrieves the hapi session and returns it to the callback
 */

var http = require('http');
var package = require('./package.json');

var config = {
    primus: null,

    server: null,

    //Enable/disable logging
    debug: false,

    //Something with a log method
    logger: console,

    //Path to mount the internal request at
    //shouldn't need to be changed unless there's a conflict
    routePath: '/hapi-primus-session/write-session'
};

var log = function () {
    if (config.debug) {
        config.logger.log.apply(config.logger, arguments);
    }
};

var primusPlugin = function (hapiServer) {
    return {
        server: function (primus) {
            primus.Spark.prototype.getSession = function (done) {
                var self = this;

                //Memoize for this spark
                if (this.session) {
                    log('Returning memoized session');
                    return done(null, this.session);
                }

                //Construct fake request to pass to pass to hapi
                var socket = {};
                var req = new http.IncomingMessage(socket);
                req.url = config.routePath;
                req.method = 'GET';
                req.headers = this.headers;

                //Construct fake response
                var res = new http.ServerResponse(req);

                //Extend response to be called from HAPI to write session
                //back here to the spark
                res._writeSession = function (session) {
                    log('[spark]', 'Received session');
                    self.session = session;
                    done(null, session);
                };

                //Emit the request from the hapi http server
                log('[spark]', 'Emitting request');
                hapiServer.listener.emit('request', req, res);
            };
        }
    };
};




module.exports = {
    name: 'primus_hapi_sessions',
    version: package.version,
    register: function (plugin, options, next) {
        Object.keys(options).forEach(function (k) {
            if (config[k]) {
                config[k] = options[k];
            }
        });

        plugin.route({
            method: 'GET',
            path: config.routePath,
            config: { },
            handler: function (request) {
                log('[primus] Got request for session');
                log('[primus] Responding with', JSON.stringify(request.session).substr(0, 100) + ' ... }');
                request.raw.res._writeSession(request.session);
            }
        });

        options.primus.use('primus_hapi_session', primusPlugin(options.server));
        next();
    }
};
