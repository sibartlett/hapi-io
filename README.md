# hapi-io

[![Greenkeeper badge](https://badges.greenkeeper.io/sibartlett/hapi-io.svg)](https://greenkeeper.io/)
[![npm](https://img.shields.io/npm/v/hapi-io.svg)](https://www.npmjs.com/package/hapi-io)
[![Build Status](https://travis-ci.org/sibartlett/hapi-io.svg?branch=master)](https://travis-ci.org/sibartlett/hapi-io)
[![Dependency Status](https://david-dm.org/sibartlett/hapi-io.svg)](https://david-dm.org/sibartlett/hapi-io)
[![devDependency Status](https://david-dm.org/sibartlett/hapi-io/dev-status.svg)](https://david-dm.org/sibartlett/hapi-io#info=devDependencies)

Awesome socket.io plugin for [hapi](http://hapijs.com/) (inspired by [express.oi](https://github.com/sibartlett/express.oi) and [express.io](https://github.com/techpines/express.io)).

##### Table of Contents

* [Installation and Configuration](#installation-and-configuration)
* [Raw access to socket.io](#raw-access-to-socketio)
* [Forward socket.io events to hapi routes](#forward-events-to-hapi-routes)


### Installation and Configuration

```sh
npm install hapi-io --save
```

```js
server.register({
  register: require('hapi-io'),
  options: {
    ...
  }
});
```

##### Options

* `connectionLabel` (optional)
* `namespaces` (optional) - an array of strings representing namespaces. Namespaces must always begin with a slash `'/'` (e.g. `'/mynamespace'`. _The default `'/'` namespace is always available irrespective if explicitly specified_, and will be the only namespace available to routes if this option is not set upon plugin initialization.
* `socketio` (optional) - an object which is passed through to socket.io
* `auth` (optional) - authorization configuration. Socket.io connections will be refused if they fail authorization. If this option is omitted: all socket.io connections will be accepted, but route level authorization will still be enforced. Value can be:
  * a string with the name of an authentication strategy registered with `server.auth.strategy()`.
  * an object with:
    * `strategies` - a string array of strategy names in order they should be attempted. If only one strategy is used, `strategy` can be used instead with the single string value.


### Raw access to socket.io

You can get raw access to the [socket.io server](http://socket.io/docs/server-api/) as follows:

```js
exports.register = function(server, options, next) {

  var io = server.plugins['hapi-io'].io;

};
```


### Forward events to hapi routes

_Perfect for exposing HTTP API endpoints over websockets!_

socket.io events can be mapped to hapi routes; reusing the same authentication, validation, plugins and handler logic.

##### Example

###### Server

```js
exports.register = function(server, options, next) {

  server.route([

    {
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
    },

    {
      method: 'POST',
      path: '/users',
      config: {
        plugins: {
          'hapi-io': {
            event: 'create-user',
            mapping: {
              headers: ['accept'],
              query: ['returnType']
            }
          }
        }
      },
      handler: function(request, reply) {
        db.users.create(request.payload, function(err, user) {
          if (err) {
            return reply(err).code(201);
          }

          if (request.headers.accept === 'application/hal+json') {
            addMeta(user);
          }

          if (request.query.returnType !== 'full') {
            delete user.favoriteColor;
          }

          reply(err, user);
        });
      }
    },

    // '/admin' namespace
    {
      method: 'GET',
      path: '/users/{id}',
      config: {
        plugins: {
          'hapi-io': {
            event: 'create-user',
            namespace: '/admin'
          }
        }
      },
      handler: function(request, reply) {
        db.adminUsers.get(request.params.id, function(err, user) {
          reply(err, user);
        });
      }
     },

  ]);
};
```

###### Client

```js
var socket = io();

socket.emit('get-user', { id: 'sibartlett'}, function(res) {
  // res is the result from the hapi route
});

socket.emit('create-user', {
  name: 'Bill Smith',
  email: 'blsmith@smithswidgets.com',
  location: 'remote',
  favoriteColor: 'green',
  returnType: 'full'
}, function (res) {
  // do something with new user
});

// '/admin' namespace
var socketA = io('/admin');

socketA.emit('get-admin-user', { id: 'mmemon'}, function(res) {
  // res is the result from the hapi route
});
```

##### How it works

Each time an event is received, a fake HTTP request is created and injected into the hapi server.

The fake HTTP request is constructed as follows:

1. The headers and querystring parameters from the socket.io handshake are added to the fake request.

  This allows you to use the route's auth stategy - to authenticate the socket.io event.

2. Each field in the event payload is mapped to one of the following hapi param types: headers, path, query or payload. The mapping is determined on a per field basis:

  1. If the field is a parameter in the route's path, it's mapped as a path parameter.

  2. If the hapi-io config is an object and has a `mapping` property, then the field is checked against the mapping. Allowed mappings are headers, query, and payload.

  3. If the field exists in the route's validate object, the value is mapped to the corresponding param type.

  4. If the route is a 'GET' method, the field is mapped as a query param.

  5. Otherwise it's mapped as a payload field.

3. Maps "Authorization" attribute from query or data object if possible and not already mapped.

##### Access socket during hapi request

You can access both the socket.io server and socket within the hapi route.

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
      var io = request.plugins['hapi-io'].io;
      var socket = request.plugins['hapi-io'].socket;

      reply({ success: true });

      if (socket) {
        // socket is only defined during a hapi-io/socket.io request
      }
    }
  });
};
```

##### Post event hook

You can do further processing on a socket.io event, after it has been processed by hapi.

You can use the `post` option to specify a function, with two parameters: `ctx` and `next`. `ctx` has the following properties:

* `io` - the socket.io Server object
* `socket` - the socket.io Socket object
* `event` - the socket.io event
* `data` - the event's data object
* `req` - the request object that was injected into hapi
* `res` - the result object that was returned by hapi
* `result` - the res.result
* `trigger` - a method that allows you to trigger another socket.io event

```js
server.route({
  method: 'POST',
  path: '/rooms/{roomId}/join',
  config: {
    plugins: {
      'hapi-io': {
        event: 'join-room',
        post: function(ctx, next) {
          ctx.socket.join(ctx.data.roomId);
          next();
        }
      }
    }
  },
  ...
});
```
