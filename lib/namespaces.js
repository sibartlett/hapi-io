'use strict';

module.exports = function(io, namespaces) {

  var nsps = {};

  nsps['/'] = io.of('/');

  if (Array.isArray(namespaces)) {
    namespaces.forEach(function(namespace) {
      nsps[namespace] = io.of(namespace);
    });
  }

  return nsps;

};
