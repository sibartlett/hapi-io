'use strict';

var request = require('./request');

module.exports = function(server, socket, socketNamespace) {
  var routingTable = server.table();

  routingTable.forEach(function(connection) {
    var routes = connection.table.filter(function(item) {
      return item.settings &&
             item.settings.plugins &&
             item.settings.plugins['hapi-io'];
    });

    routes.forEach(function(route) {
      var hapiio = route.settings.plugins['hapi-io'];
      var isBasic = typeof hapiio === 'string';

      var event = isBasic ? hapiio : hapiio.event;
      var namespace = !isBasic && hapiio.namespace ? hapiio.namespace : '/';

      if (namespace !== socketNamespace) {
        return;
      }

      socket.on(event, function(data, respond) {
        if (typeof data === 'function') {
          respond = data;
          data = undefined;
        }

        var req = request({ socket: socket, route: route, data: data });

        server.inject(req, function(res) {

          var responder = function(err, result) {
            if (!respond) {
              return;
            }

            if (err) {
              // Should we be responding with the error?
              return respond(err);
            }

            respond(result || res.result);
          };

          var context = {
            io: server.plugins['hapi-io'].io,
            socket: socket,
            event: event,
            data: data,
            req: req,
            res: res,
            result: res.result,
            trigger: function(_event, _data, nsp) {
              var packet = {
                type: 2,
                nsp: nsp || '/',
                id: -1,
                data: [_event, _data]
              };

              socket.onevent(packet);
            }
          };

          if (hapiio.post) {
            return hapiio.post(context, responder);
          }

          return responder();
        });
      });
    });
  });
};
