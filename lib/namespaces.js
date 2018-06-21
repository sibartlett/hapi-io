'use strict';

module.exports = (io, namespaces) => {

    const nsps = {};

    nsps['/'] = io.of('/');

    if (Array.isArray(namespaces)) {
        namespaces.forEach((namespace) => {

            nsps[namespace] = io.of(namespace);

        });
    }

    return nsps;

};
