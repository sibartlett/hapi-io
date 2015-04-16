'use strict';

var url = require('url');
var _ = require('lodash');

module.exports = function(socket, route, data) {
  var method = route.method;
  var path = route.path;
  var validate = route.settings && route.settings.validate;
  var hapiio = route.settings.plugins['hapi-io'] || {};
  var mapping = hapiio.mapping || {};
  var dataKeys = [];

  if (data) {
    dataKeys = Object.keys(data);
  } else {
    data = {};
  }

  var get = method === 'get';

  var newPath = path.replace(/(?:\{(\w+)(\??)\})/g, function(group, key, type) {
    var index = dataKeys.indexOf(key);
    var optional = type === '?';

    if (index === -1) {
      if (optional) {
        return '';
      }

      return group;
    }

    dataKeys.splice(index, 1);
    return data[key];
  });

  var headers = {};
  var payload = {};
  var query = {};

  _.each(dataKeys, function(key) {

    if (mapping.query && mapping.query.indexOf(key) !== -1) {
      query[key] = data[key];
      return;
    }

    if (mapping.payload && mapping.payload.indexOf(key) !== -1) {
      payload[key] = data[key];
      return;
    }

    if (mapping.headers && mapping.headers.indexOf(key) !== -1) {
      headers[key] = data[key];
      return;
    }

    if (validate && validate.query && validate.query[key]) {
      query[key] = data[key];
      return;
    }

    if (validate && validate.payload && validate.payload[key]) {
      payload[key] = data[key];
      return;
    }

    if (validate && validate.headers && validate.headers[key]) {
      headers[key] = data[key];
      return;
    }

    if (get) {
      query[key] = data[key];
      return;
    }

    payload[key] = data[key];
  });

  var uri = url.parse(newPath);

  uri.query = _.extend(socket.request._query, query, uri.query);

  return {
    // credentials: socket.credentials,
    method: method,
    url: url.format(uri),
    headers: _.defaults(headers,
      _.omit(socket.request.headers, 'accept-encoding')
    ),
    payload: JSON.stringify(payload)
  };
};
