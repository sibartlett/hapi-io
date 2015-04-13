'use strict';

var request = require('./request');

module.exports = function(server, socket) {
  var routingTable = server.table();

  routingTable.forEach(function(connection) {
    var routes = connection.table.filter(function(item) {
      return item.settings &&
             item.settings.plugins &&
             item.settings.plugins['hapi-io'];
    });

    routes.forEach(function(route) {
      var hapiio = route.settings.plugins['hapi-io'];
      var event = typeof hapiio === 'string' ? hapiio : hapiio.event;

      socket.on(event, function(data, respond) {
        if (typeof data === 'function') {
          respond = data;
          data = undefined;
        }

        var req = request(socket, route, data);

        server.inject(request, function(res) {
          if (!respond) {
            return;
          }

          return respond(res.result);
        });
      });
    });
  });
};
