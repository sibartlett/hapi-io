const request = require('./request');

module.exports = function(server, socket, socketNamespace) {
  const routingTable = server.table();

  const routes = routingTable.filter(function(item) {
    return item.settings &&
           item.settings.plugins &&
           item.settings.plugins['hapi-io'];
  });

  routes.forEach(function(route) {
    const hapiio = route.settings.plugins['hapi-io'];
    const isBasic = typeof hapiio === 'string';

    const event = isBasic ? hapiio : hapiio.event;
    const namespace = !isBasic && hapiio.namespace ? hapiio.namespace : '/';

    if (namespace !== socketNamespace) {
      return;
    }

    socket.on(event, async (data, respond) => {
      console.log(data)
      if (typeof data === 'function') {
        respond = data;
        data = undefined;
      }

      const req = request({ socket: socket, route: route, data: data });

      const res = await server.inject(req);

      const responder = function(err, result) {
        if (!respond) {
          return;
        }

        if (err) {
          // Should we be responding with the error?
          return respond(err);
        }

        respond(result || res.result);
      };

      const context = {
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
};
