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

exports.register = function(server, options, next) {

  options = Hoek.applyToDefaults(internals.defaults, options);

  var s = options.connectionLabel ?
          server.select(options.connectionLabel) : server;

  if (!s) {
    return next('hapi-io - no server');
  }

  if (!s.connections.length) {
    return next('hapi-io - no connection');
  }

  if (s.connections.length !== 1) {
    return next('hapi-io - multiple connections');
  }

  var connection = s && s.connections.length && s.connections[0];

  if (!connection) {
    return next('No connection/listener found');
  }

  var io = socketio(connection.listener, options.socketio);

  var nsps = namespaces(io, options.namespaces);

  s.expose('io', io);

  s.ext('onRequest', function(request, reply) {
    if (!request.plugins['hapi-io']) {
      request.plugins['hapi-io'] = {};
    }

    request.plugins['hapi-io'].io = request.server.plugins['hapi-io'].io;
    return reply.continue();
  });

  if (options.auth) {
    auth(s, io, options);
  }

  Object.keys(nsps).forEach(function(namespace) {
    nsps[namespace].on('connection', function(socket) {
      routes(s, socket, namespace);
    });
  });

  next();
};

exports.register.attributes = {
  pkg: require('../package.json')
};
