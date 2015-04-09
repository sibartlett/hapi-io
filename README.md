# hapi-io

[![npm](https://img.shields.io/npm/v/hapi-io.svg)](https://www.npmjs.com/package/hapi-io)
[![Dependency Status](https://david-dm.org/sibartlett/hapi-io.svg)](https://david-dm.org/sibartlett/hapi-io)

Awesome socket.io plugin for [hapi](http://hapijs.com/) (inspired by [express.oi](https://github.com/sibartlett/express.oi) and [express.io](https://github.com/techpines/express.io)).

* Adds socket.io to your hapi server
* [Forward socket.io events to hapi routes](#forward-events-to-hapi-routes)

### Installation

```sh
npm install hapi-io --save
```

```js
server.register({
  register: require('hapi-io'),
  options: {
    connectionLabel: 'web' // Optional
  }
});
```

#### Raw access to socket.io

You can get raw access to the [socket.io server](http://socket.io/docs/server-api/) as follows:

```js
exports.register = function(server, options, next) {

  var io = server.plugins['hapi-io'].io;

};
```

#### Forward events to hapi routes

_Perfect for exposing HTTP API endpoints over websockets!_

socket.io events can be mapped to hapi routes; reusing the same authentication, validation, plugins and handler logic.

##### Example

###### Server

```js
exports.register = function(server, options, next) {

  server.route({
    method: 'GET',
    path: '/users/{id}',
    config: {
      plugins: {
        'hapi-io': 'get-user'
      }
    },
    handler: function(request, reply) {
      db.users.get(request.params.id, function(err, user) {
        reply(err, user);
      });
    }
  });

};
```

###### Client

```js
var socket = io();
socket.emit('get-user', { id: 'sibartlett'}, function(res) {
  // res is the result from the hapi route
});
```

##### How it works

Each time an event is received, a fake HTTP request is created and injected into the hapi server.

The fake HTTP request is constructed as follows:

1. The headers and querystring parameters from the socket.io handshake are added to the fake request.

  This allows you to use the route's auth stategy - to authenticate the socket.io event.

2. Each field in the event payload is mapped to one of the following hapi param types: path, query, or payload. The mapping is determined on a per field basis:

  1. If the field is a parameter in the route's path, it's mapped as a path parameter.
  2. If the field exists in the route's validate object, the value is mapped to the corresponding param type.
  3. If the route is a 'GET' method, the field is mapped as a query param.
  4. Otherwise it's mapped as a payload field.
