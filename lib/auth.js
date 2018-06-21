'use strict';

const Async = require('async');
const Request = require('./request');

module.exports = (server, io, options) => {

    let strategies = options.auth.strategies;

    // if a raw string is passed in, use that (as per README.md)
    if (typeof options.auth === 'string') {
        strategies = [options.auth];
    }

    if (!strategies && options.auth.strategy) {
        strategies = [options.auth.strategy];
    }

    // This route purposely mirrors socket.io's path
    server.route({
        method: 'GET',
        path: options.socketio.path,
        config: {
            id: 'socket.io',
            plugins: {
                lout: false
            }
        },
        handler: (req, reply) => reply()
    });

    io.use((socket, next) => {

        const route = server.lookup('socket.io');
        const req = Request({ socket, route });

        server.inject(req, (res) => {
            // We need to call server.inject, in order to call server.auth.test

            Async.some(strategies, (strategy, cb) => {

                server.auth.test(strategy, res.request, (err, credentials) => {

                    if (err) {
                        return cb(null, false);
                    }

                    socket.credentials = credentials;
                    next();
                    cb(null, true);
                });
            },

            (err, result) => {

                if (!result) {
                    next(new Error('Authentication Failed'));
                    socket.disconnect();
                }
            });

        });
    });
};
