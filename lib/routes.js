'use strict';

var url = require('url');
var _ = require('lodash');

var buildRequest = function(route, socket, data) {
  var keys = Object.keys(data);
  var validate = route.settings.validate;
  var get = !route.method || route.method === 'get';

  var path = route.path.replace(/(\{\w+\})/g, function(group) {
    var key = group.substring(1, group.length - 1);

    var index = keys.indexOf(key);

    if (index === -1) {
      return group;
    }

    keys.splice(index, 1);
    return data[key];
  });

  var payload = {};
  var query = {};

  _.each(keys, function(key) {
    if (validate && validate.query && validate.query[key]) {
      query[key] = data[key];
      return;
    }

    if (validate && validate.payload && validate.payload[key]) {
      payload[key] = data[key];
      return;
    }

    if (get) {
      query[key] = data[key];
      return;
    }

    payload[key] = data[key];
  });

  var uri = url.parse(path);

  uri.query = _.extend(socket.request._query, query, uri.query);

  return {
    method: route.method,
    url: url.format(uri),
    headers: _.omit(socket.request.headers, 'accept-encoding'),
    payload: JSON.stringify(payload)
  };
};

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

        var request = buildRequest(route, socket, data);

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
