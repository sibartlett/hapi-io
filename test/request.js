'use strict';

var Code = require('code');
var Lab = require('lab');
var lab = exports.lab = Lab.script();

var expect = Code.expect;
var describe = lab.describe;
var it = lab.it;

describe('request', function() {

  var request = require('../lib/request');

  describe('request(socket, route, data)', function() {

    it('handles empty request', function(done) {
      var req = request({});

      expect(req).to.equal({
        method: 'get',
        url: '/',
        headers: {},
        payload: JSON.stringify({})
      });

      done();
    });

    it('maps socket param to request.plugins["hapi-io"]', function(done) {
      var req = request({
        route: {
          method: 'get',
          path: '/'
        },
        socket: 'MY_SOCKET'
      });

      expect(req).to.equal({
        method: 'get',
        url: '/',
        headers: {},
        payload: JSON.stringify({}),
        plugins: {
          'hapi-io': {
            socket: 'MY_SOCKET'
          }
        }
      });

      done();
    });

    it('maps data param to query object when GET', function(done) {
      var req = request({
        route: {
          method: 'get',
          path: '/'
        },
        data: { myparam: 'hello world'}
      });

      expect(req).to.equal({
        method: 'get',
        url: '/?myparam=hello%20world',
        headers: {},
        payload: JSON.stringify({})
      });

      done();
    });

    it('maps data param to payload object when POST', function(done) {
      var req = request({
        route: {
          method: 'post',
          path: '/'
        },
        data: { myparam: 'hello world'}
      });

      expect(req).to.equal({
        method: 'post',
        url: '/',
        headers: {},
        payload: JSON.stringify({myparam: 'hello world'})
      });

      done();
    });

    it('maps data param to payload with validate mapping', function(done) {
      var req = request({
        route: {
          method: 'post',
          path: '/',
          settings: {
            validate: {
              payload: {
                myparam: true
              }
            }
          }
        },
        data: { myparam: 'hello world'}
      });

      expect(req).to.equal({
        method: 'post',
        url: '/',
        headers: {},
        payload: JSON.stringify({ myparam: 'hello world'})
      });

      done();
    });

    it('maps data param to query with validate mapping', function(done) {
      var req = request({
        route: {
          method: 'post',
          path: '/',
          settings: {
            validate: {
              query: {
                myparam: true
              }
            }
          }
        },
        data: { myparam: 'hello world'}
      });

      expect(req).to.equal({
        method: 'post',
        url: '/?myparam=hello%20world',
        headers: {},
        payload: JSON.stringify({})
      });

      done();
    });

    it('maps data param to headers with validate mapping', function(done) {
      var req = request({
        route: {
          method: 'post',
          path: '/',
          settings: {
            validate: {
              headers: {
                myparam: true
              }
            }
          }
        },
        data: { myparam: 'hello world'}
      });

      expect(req).to.equal({
        method: 'post',
        url: '/',
        headers: { myparam: 'hello world'},
        payload: JSON.stringify({})
      });

      done();
    });

    it('maps data param to query when validate mapping specifies both query and headers', function(done) {
      var req = request({
        route: {
          method: 'post',
          path: '/',
          settings: {
            validate: {
              query: {
                myparam: true
              },
              headers: {
                myparam: true
              }
            }
          }
        },
        data: { myparam: 'hello world'}
      });

      expect(req).to.equal({
        method: 'post',
        url: '/?myparam=hello%20world',
        headers: {},
        payload: JSON.stringify({})
      });

      done();
    });

    it('maps data param to query when validate mapping specifies both query and payload', function(done) {
      var req = request({
        route: {
          method: 'post',
          path: '/',
          settings: {
            validate: {
              query: {
                myparam: true
              },
              payload: {
                myparam: true
              }
            }
          }
        },
        data: { myparam: 'hello world'}
      });

      expect(req).to.equal({
        method: 'post',
        url: '/?myparam=hello%20world',
        headers: {},
        payload: JSON.stringify({})
      });

      done();
    });

    it('maps data param to payload with custom mapping', function(done) {
      var req = request({
        route: {
          method: 'post',
          path: '/',
          settings: {
            plugins: {
              'hapi-io': {
                mapping: {
                  payload: ['myparam']
                }
              }
            }
          }
        },
        data: { myparam: 'hello world'}
      });

      expect(req).to.equal({
        method: 'post',
        url: '/',
        headers: {},
        payload: JSON.stringify({ myparam: 'hello world'})
      });

      done();
    });

    it('maps data param to query with custom mapping', function(done) {
      var req = request({
        route: {
          method: 'post',
          path: '/',
          settings: {
            plugins: {
              'hapi-io': {
                mapping: {
                  query: ['myparam']
                }
              }
            }
          }
        },
        data: { myparam: 'hello world'}
      });

      expect(req).to.equal({
        method: 'post',
        url: '/?myparam=hello%20world',
        headers: {},
        payload: JSON.stringify({})
      });

      done();
    });

    it('maps data param to headers with custom mapping', function(done) {
      var req = request({
        route: {
          method: 'post',
          path: '/',
          settings: {
            plugins: {
              'hapi-io': {
                mapping: {
                  headers: ['myparam']
                }
              }
            }
          }
        },
        data: { myparam: 'hello world'}
      });

      expect(req).to.equal({
        method: 'post',
        url: '/',
        headers: { myparam: 'hello world'},
        payload: JSON.stringify({})
      });

      done();
    });

    it('maps Authorization header from query', function(done) {
      var socket = {
        request: {
          _query: { Authorization: 'MyToken'},
          headers: {}
        }
      };

      var req = request({
        socket: socket,
        route: {
          method: 'get',
          path: '/'
        },
        data: {}
      });

      expect(req).to.equal({
        method: 'get',
        url: '/?Authorization=MyToken',
        headers: { Authorization: 'MyToken'},
        payload: JSON.stringify({}),
        plugins: {
          'hapi-io': {
            socket: socket
          }
        }
      });

      done();
    });

    it('maps Authorization header from data', function(done) {
      var req = request({
        route: {
          method: 'get',
          path: '/'
        },
        data: { Authorization: 'MyToken'}
      });

      expect(req).to.equal({
        method: 'get',
        url: '/?Authorization=MyToken',
        headers: { Authorization: 'MyToken'},
        payload: JSON.stringify({})
      });

      done();
    });

    it('maps Authorization header case-insensitive', function(done) {
      var req = request({
        route: {
          method: 'post',
          path: '/'
        },
        data: { authorization: 'MyToken'}
      });

      expect(req).to.equal({
        method: 'post',
        url: '/',
        headers: { authorization: 'MyToken'},
        payload: JSON.stringify({ authorization: 'MyToken'})
      });

      done();
    });

    it('does not map Authorization header when it already exists', function(done) {
      var socket = {
        request: {
          headers: { Authorization: 'MyToken'}
        }
      };

      var req = request({
        socket: socket,
        route: {
          method: 'get',
          path: '/'
        }
      });

      expect(req).to.equal({
        method: 'get',
        url: '/',
        headers: { Authorization: 'MyToken'},
        payload: JSON.stringify({}),
        plugins: {
          'hapi-io': {
            socket: socket
          }
        }
      });

      done();
    });

    it('maps data param to path param', function(done) {
      var req = request({
        route: {
          method: 'get',
          path: '/blog-post/{blogId}'
        },
        data: {
          blogId: 1
        }
      });

      expect(req).to.equal({
        method: 'get',
        url: '/blog-post/1',
        headers: {},
        payload: JSON.stringify({})
      });

      done();
    });

    it('does not map missing data param to path param', function(done) {
      var req = request({
        route: {
          method: 'get',
          path: '/blog-post/{blogId}'
        }
      });

      expect(req).to.equal({
        method: 'get',
        url: '/blog-post/{blogId}',
        headers: {},
        payload: JSON.stringify({})
      });

      done();
    });

    it('maps data param to optional path param', function(done) {
      var req = request({
        route: {
          method: 'get',
          path: '/blog-post/{blogId?}'
        },
        data: {
          blogId: 1
        }
      });

      expect(req).to.equal({
        method: 'get',
        url: '/blog-post/1',
        headers: {},
        payload: JSON.stringify({})
      });

      done();
    });

    it('does not map missing data param to optional path param', function(done) {
      var req = request({
        route: {
          method: 'get',
          path: '/blog-post/{blogId?}'
        }
      });

      expect(req).to.equal({
        method: 'get',
        url: '/blog-post/',
        headers: {},
        payload: JSON.stringify({})
      });

      done();
    });

  });

});
