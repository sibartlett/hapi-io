'use strict';

var async = require('async');
var request = require('./request');

module.exports = function(server, io, options) {
  var strategies = options.auth.strategies;

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
    handler: function(req, reply) {
      reply();
    }
  });

  io.use(function(socket, next) {
    var route = server.lookup('socket.io');
    var req = request({ socket: socket, route: route});

    server.inject(req, function(res) {
      // We need to call server.inject, in order to call server.auth.test

      async.some(strategies, function(strategy, cb) {
        server.auth.test(strategy, res.request, function(err, credentials) {
          if (err) {
            return cb(null, false);
          }

          socket.credentials = credentials;
          next();
          cb(null, true);
        });
      },

      function(err, result) {
        if (!result) {
          next(new Error('Authentication Failed'));
          socket.disconnect();
        }
      });

    });
  });
};
