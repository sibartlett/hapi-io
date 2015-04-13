'use strict';

var url = require('url');
var _ = require('lodash');

module.exports = function(socket, route, data) {
  var method = route.method;
  var path = route.path;
  var validate = route.settings && route.settings.validate;
  var dataKeys = [];

  if (data) {
    dataKeys = Object.keys(data);
  } else {
    data = {};
  }

  var get = method === 'get';

  var newPath = path.replace(/(\{\w+\})/g, function(group) {
    var key = group.substring(1, group.length - 1);

    var index = dataKeys.indexOf(key);

    if (index === -1) {
      return group;
    }

    dataKeys.splice(index, 1);
    return data[key];
  });

  var payload = {};
  var query = {};

  _.each(dataKeys, function(key) {
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

  var uri = url.parse(newPath);

  uri.query = _.extend(socket.request._query, query, uri.query);

  return {
    // credentials: socket.credentials,
    method: method,
    url: url.format(uri),
    headers: _.omit(socket.request.headers, 'accept-encoding'),
    payload: JSON.stringify(payload)
  };
};
