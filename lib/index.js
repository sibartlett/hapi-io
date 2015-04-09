'use strict';

var _ = require('lodash');
var socketio = require('socket.io');
var routes = require('./routes');

exports.register = function(server, options, next) {

  _.defaults(options, {});

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

  var listener = s && s.connections.length && s.connections[0].listener;

  if (!listener) {
    return next('No connection/listener found');
  }

  var io = socketio(listener);

  s.expose('io', io);

  io.on('connection', function(socket) {
    routes(s, socket);
  });

  next();
};

exports.register.attributes = {
  pkg: require('../package.json')
};
