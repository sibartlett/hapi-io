module.exports = function(io, namespaces) {

  const nsps = {};

  nsps['/'] = io.of('/');

  if (Array.isArray(namespaces)) {
    namespaces.forEach(function(namespace) {
      nsps[namespace] = io.of(namespace);
    });
  }

  return nsps;

};
