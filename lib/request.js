'use strict';

const Url = require('url');
const Hoek = require('hoek');

const getPlugins = (options) => {

    if (!options.socket) {
        return;
    }

    return {
        'hapi-io': {
            socket: options.socket
        }
    };
};

module.exports = (options) => {

    const socket = options.socket || {};
    const socketRequest = socket.request || {};
    const route = options.route || {};
    const data = options.data || {};

    const method = (route.method || 'get').toLowerCase();
    const path = route.path || '/';
    const settings = route.settings || {};
    const validate = settings.validate || {};
    const plugins = settings.plugins || {};
    const hapiio = plugins['hapi-io'] || {};
    const mapping = hapiio.mapping || {};
    const dataKeys = Object.keys(data);

    const get = method === 'get';

    const newPath = path.replace(/(?:\{(\w+)(\??)\})/g, (group, key, type) => {

        const index = dataKeys.indexOf(key);
        const optional = type === '?';

        if (index === -1) {
            if (optional) {
                return '';
            }

            return group;
        }

        dataKeys.splice(index, 1);
        return data[key];
    });

    const headers = Hoek.clone(socketRequest.headers) || {};
    delete headers['accept-encoding'];

    const payload = {};
    const query = {};

    dataKeys.forEach((key) => {

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

    const uri = Url.parse(newPath, true);

    const newQuery = {};
    Hoek.merge(newQuery, socketRequest._query);
    Hoek.merge(newQuery, query);
    Hoek.merge(newQuery, uri.query);

    uri.query = newQuery;
    delete uri.search;

    // Auto map "Authorization" attribute to Authorization header
    // TODO: Make this configurable?
    const headerNames = ['Authorization'];
    headerNames.some((value) => {

        return [value, value.toLowerCase()].some((header) => {

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

    const pluginData = getPlugins(options);

    const result = {
        // credentials: socket.credentials,
        method,
        url: Url.format(uri),
        headers,
        payload: JSON.stringify(payload)
    };

    if (pluginData) {
        result.plugins = pluginData;
    }

    return result;
};
