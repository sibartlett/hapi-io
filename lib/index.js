'use strict';

var _ = require('lodash');
var socketio = require('socket.io');
var auth = require('./auth');
var routes = require('./routes');

// Declare internals

var internals = {
  defaults: {
    socketio: {
      path: '/socket.io'
    }
  }
};

exports.register = function(server, options, next) {

  _.defaults(options, internals.defaults);

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

  io.on('connection', function(socket) {
    routes(s, socket);
  });

  next();
};

exports.register.attributes = {
  pkg: require('../package.json')
};
