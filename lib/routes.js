'use strict';

const Request = require('./request');

module.exports = (server, socket, socketNamespace) => {

    const routingTable = server.table();

    const routes = routingTable.filter((item) => {

        return item.settings &&
               item.settings.plugins &&
               item.settings.plugins['hapi-io'];
    });

    routes.forEach((route) => {

        const hapiio = route.settings.plugins['hapi-io'];
        const isBasic = typeof hapiio === 'string';

        const event = isBasic ? hapiio : hapiio.event;
        const namespace = !isBasic && hapiio.namespace ? hapiio.namespace : '/';

        if (namespace !== socketNamespace) {
            return;
        }

        socket.on(event, async (data, respond) => {

            if (typeof data === 'function') {
                respond = data;
                data = undefined;
            }

            const req = Request({ socket, route, data });

            const res = await server.inject(req);

            const responder = (err, result) => {

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
                socket,
                event,
                data,
                req,
                res,
                result: res.result,
                trigger: (_event, _data, nsp) => {

                    const packet = {
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
