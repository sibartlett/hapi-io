'use strict';

var Code = require('code');
var Lab = require('lab');
var lab = exports.lab = Lab.script();

var expect = Code.expect;
var describe = lab.describe;
var it = lab.it;

describe('request', function() {

  var namespaces = require('../lib/namespaces');

  describe('namespaces(io, namespaces)', function() {

    it('returns object containing namespaces', function(done) {
      var io = { of: function(namespace) { return namespace; }};
      var names = ['/hello', '/bye'];
      var nsps = namespaces(io, names);

      expect(nsps).to.equal({
        '/': io.of('/'),
        '/hello': io.of('/hello'),
        '/bye': io.of('/bye')
      });

      done();
    });

    it('always returns default namespace', function(done) {
      var io = { of: function(namespace) { return namespace; }};
      var names = 'blah';
      var nsps = namespaces(io, names);

      expect(nsps).to.equal({
        '/': io.of('/')
      });

      done();
    });

  });

});
