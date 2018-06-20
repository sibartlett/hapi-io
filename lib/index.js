'use strict';

var Hoek = require('hoek');
var socketio = require('socket.io');
var auth = require('./auth');
var routes = require('./routes');
var namespaces = require('./namespaces');

// Declare internals

var internals = {
  defaults: {
    socketio: {
      path: '/socket.io'
    }
  }
};

exports.plugin = {
  pkg: require('../package.json'),
  register: async (server, options) => {

    options = Hoek.applyToDefaults(internals.defaults, options);

    if (!server) {
      return next('hapi-io - no server');
    }

    const io = socketio(server.listener, options.socketio);

    const nsps = namespaces(io, options.namespaces);

    server.expose('io', io);

    server.ext('onRequest', function(request, h) {
      if (!request.plugins['hapi-io']) {
        request.plugins['hapi-io'] = {};
      }

      request.plugins['hapi-io'].io = request.server.plugins['hapi-io'].io;
      return h.continue;
    });

    if (options.auth) {
      auth(server, io, options);
    }

    Object.keys(nsps).forEach(function(namespace) {
      nsps[namespace].on('connection', function(socket) {
        routes(server, socket, namespace);
      });
    });
  }
};
