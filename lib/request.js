'use strict';

var url = require('url');
var Hoek = require('hoek');

var getPlugins = function(options) {
  if (!options.socket) {
    return;
  }

  return {
    'hapi-io': {
      socket: options.socket
    }
  };
};

module.exports = function(options) {
  var socket = options.socket || {};
  var socketRequest = socket.request || {};
  var route = options.route || {};
  var data = options.data || {};

  var method = (route.method || 'get').toLowerCase();
  var path = route.path || '/';
  var settings = route.settings || {};
  var validate = settings.validate || {};
  var plugins = settings.plugins || {};
  var hapiio = plugins['hapi-io'] || {};
  var mapping = hapiio.mapping || {};
  var dataKeys = Object.keys(data);

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
  
  var headers = Hoek.clone(socketRequest.headers) || {};
  delete headers['accept-encoding'];

  var payload = {};
  var query = {};

  dataKeys.forEach(function(key) {

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

    if (validate.query && validate.query[key]) {
      query[key] = data[key];
      return;
    }

    if (validate.payload && validate.payload[key]) {
      payload[key] = data[key];
      return;
    }

    if (validate.headers && validate.headers[key]) {
      headers[key] = data[key];
      return;
    }

    if (get) {
      query[key] = data[key];
      return;
    }

    payload[key] = data[key];
  });

  var uri = url.parse(newPath, true);

  var newQuery = {};
  Hoek.merge(newQuery, socketRequest._query);
  Hoek.merge(newQuery, query);
  Hoek.merge(newQuery, uri.query);

  uri.query = newQuery;
  delete uri.search;

  // Auto map "Authorization" attribute to Authorization header
  // TODO: Make this configurable?
  var headerNames = ['Authorization'];
  headerNames.some(function(value) {
    return [value, value.toLowerCase()].some(function(header) {
      if (headers[header]) {
        return true;
      }
      if (payload[header]) {
        headers[header] = payload[header];
        return true;
      }
      if (uri.query[header]) {
        headers[header] = uri.query[header];
        return true;
      }

      return false;
    });
  });

  var pluginData = getPlugins(options);

  var result = {
    // credentials: socket.credentials,
    method: method,
    url: url.format(uri),
    headers: headers,
    payload: JSON.stringify(payload)
  };

  if (pluginData) {
    result.plugins = pluginData;
  }

  return result;
};
