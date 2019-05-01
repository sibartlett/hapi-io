'use strict';

const Hoek = require('hoek');
const SocketIO = require('socket.io');
const Auth = require('./auth');
const Routes = require('./routes');
const Namespaces = require('./namespaces');

// Declare internals

const internals = {
    defaults: {
        socketio: {
            path: '/socket.io'
        }
    }
};

exports.plugin = {
    pkg: require('../package.json'),
    register: (server, options) => {

        options = Hoek.applyToDefaults(internals.defaults, options);

        if (!server) {
            throw 'hapi-io - no server';
        }

        const io = SocketIO(server.listener, options.socketio);

        const nsps = Namespaces(io, options.namespaces);

        server.expose('io', io);

        server.ext('onRequest', (request, h) => {

            if (!request.plugins['hapi-io']) {
                request.plugins['hapi-io'] = {};
            }

            request.plugins['hapi-io'].io = request.server.plugins['hapi-io'].io;
            return h.continue;
        });

        if (options.auth) {
            Auth(server, io, options);
        }

        Object.keys(nsps).forEach((namespace) => {

            nsps[namespace].on('connection', (socket) => {

                Routes(server, socket, namespace);
            });
        });
    }
};
