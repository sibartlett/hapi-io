'use strict';

module.exports = function(server, io, namespaces) {

    var nsps = {};

    nsps["/"] = io.of('/');

    if (Array.isArray(namespaces)) {
        namespaces.forEach(function(namespace) {
            if (!nsps[namespace]) {
                nsps[namespace] = io.of(namespace);
            }
        });
    }

    return nsps;

};